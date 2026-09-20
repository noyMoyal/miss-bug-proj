import express from 'express'
import { bugService } from './services/bug.service.js'
import { loggerService } from './services/logger.service.js'
const app = express()

app.get('/' ,  (req, res) => res.send('Hello team!!!'))


app.get('/api/bug', (req, res) => {
    bugService.query().then(bugs => {
        res.send(bugs)
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
    bugService.getById(bugId)
        .then(bug => res.send(bug))
        .catch(err => {
            loggerService.error('Cannot get bug', err)
            res.status(400).send('Cannot get bug')
        })
})

app.get('/api/bug/:bugId/remove', (req, res) => {
    const { bugId } = req.params
    bugService.remove(bugId).then(() => {
        res.send('Removed!')
    }).catch(err => {
        loggerService.error('Cannot remove bug', err)
        res.status(400).send('Cannot remove bug')
    })
})



app.listen(3030, () => console.log('Server ready at port 3030'))