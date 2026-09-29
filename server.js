import express from 'express'
import cookieParser from 'cookie-parser'
import { bugService } from './services/bug.service.js'
import { loggerService } from './services/logger.service.js'
const app = express()
app.use(cookieParser())
app.use(express.static('public'))
app.use(express.json())

app.get('/' ,  (req, res) => res.send('Hello team!!!'))

function getQueryOptions(query) {
    const filterBy = {
        txt: query.txt || '',
        minSeverity: +query.minSeverity || 0,
        labels: query.labels || [],
    }
    const sortBy = {
        sortField: query.sortField || '',
        sortDir: +query.sortDir || 1,
    }
    const pageIdx = query.pageIdx !== undefined ? +query.pageIdx : undefined
    const pageSize = +query.pageSize || 3
    return { filterBy, sortBy, pageIdx, pageSize }
}

app.get('/api/bug', (req, res) => {
    const { filterBy, sortBy, pageIdx, pageSize } = getQueryOptions(req.query)
    bugService.query(filterBy, sortBy, pageIdx, pageSize).then(data => {
        res.send(data)
    }).catch(err => {
        loggerService.error('Cannot get bugs', err)
        res.status(400).send('Cannot get bugs')
    })
})

app.post('/api/bug', (req, res) => {
    const { title, severity, description, labels } = req.body
    if (!title) return res.status(400).send('Missing required fields')
    if (severity === undefined) return res.status(400).send('Missing required fields')
    const bugToSave = {
        title,
        severity: +severity || 1,
        description: description || '',
        labels: labels || [],
        createdAt: Date.now(),
    }
    bugService.save(bugToSave).then(bug => res.send(bug))
})

app.put('/api/bug/:bugId', (req, res) => {
    const { bugId } = req.params
    const { title, severity, description, labels } = req.body
    if (!title || severity === undefined) {
        return res.status(400).send('Missing required fields')
    }
    bugService.getById(bugId).then(existingBug => {
        const bugToSave = {
            ...existingBug,
            ...(title && { title }),
            ...(severity !== undefined && { severity: +severity }),
            ...(description !== undefined && { description }),
            ...(labels && { labels }),
        }
        bugService.save(bugToSave).then(bug => res.send(bug))
    })
}) 

app.get('/api/bug/save', (req, res) => {
    const { title, description, severity, _id } = req.query
    const bug = {
        _id,
        title,
        description,
        severity: +severity,
    }
    bugService.save(bug).then((savedBug) => {
        res.send(savedBug)
    }).catch((err) => {
        loggerService.error('Cannot save bug', err)
        res.status(400).send('Cannot save bug')
    })
})
app.get('/api/bug/:bugId', (req, res) => {
    const { bugId } = req.params

    let visitedBugs = req.cookies.visitedBugs || []
    if (!visitedBugs.includes(bugId)) {
        if (visitedBugs.length >= 3) {
            return res.status(401).send('Wait for a bit')
        }
        visitedBugs.push(bugId)
    }
    res.cookie('visitedBugs', visitedBugs, { maxAge: 1000 * 7 })
    console.log(`User visited at the following bugs: ${visitedBugs}`)

    bugService.getById(bugId)
        .then(bug => res.send(bug))
        .catch(err => {
            loggerService.error('Cannot get bug', err)
            res.status(400).send('Cannot get bug')
        })
})

app.delete('/api/bug/:bugId', (req, res) => {
    const { bugId } = req.params
    bugService.remove(bugId).then(() => {
        res.send('Deleted!')
    }).catch(err => {
        loggerService.error('Cannot Delete bug', err)
        res.status(400).send('Cannot Delete bug')
    })
})



app.listen(3030, () => console.log('Server ready at port 3030'))