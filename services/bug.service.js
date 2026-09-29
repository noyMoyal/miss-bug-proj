import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

export const bugService = {
    query,
    save,
    getById,
    remove
}

const bugs = utilService.readJsonFile('data/bug.json')

function query(filterBy = {}, sortBy = {}, pageIdx, pageSize = 3) {
    let filteredBugs = [...bugs]
    if (filterBy.txt) {
        const regex = new RegExp(filterBy.txt, 'i')
        filteredBugs = filteredBugs.filter(bug => regex.test(bug.title))
    }
    if (filterBy.minSeverity) {
        filteredBugs = filteredBugs.filter(bug => bug.severity >= filterBy.minSeverity)
    }
    if (filterBy.labels && filterBy.labels.length) {
        filteredBugs = filteredBugs.filter(bug =>
            filterBy.labels.some(label => bug.labels?.includes(label))
        )
    }
    const { sortField, sortDir } = sortBy
if (sortField === 'severity' || sortField === 'createdAt') {
    filteredBugs.sort((a, b) => (a[sortField] - b[sortField]) * sortDir)
} else if (sortField === 'title') {
    filteredBugs.sort((a, b) => a.title.localeCompare(b.title) * sortDir)
}

    let pageCount
if (pageIdx !== undefined) {
    const startIdx = pageIdx * pageSize
    pageCount = Math.ceil(filteredBugs.length / pageSize)
    filteredBugs = filteredBugs.slice(startIdx, startIdx + pageSize)
}
return Promise.resolve({ bugs: filteredBugs, pageCount })
}

function save(bug) {
    if (bug._id) {
        const idx = bugs.findIndex(currBug => currBug._id === bug._id)
        bugs[idx] = bug
    } else {
        bug._id = utilService.makeId()
        bug.createdAt = Date.now()
        bugs.unshift(bug)
    }
    return _saveBugsToFile().then(() => bug)
}


function _saveBugsToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(bugs, null, 2)
        fs.writeFile('data/bug.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to bugs file', err)
                return reject(err)
            }
            resolve()
        })
    })
}

function getById(bugId) {
    const bug = bugs.find(bug => bug._id === bugId)
    if (!bug) return Promise.reject('Bug not found!')
    return Promise.resolve(bug)
}

function remove(bugId) {
    const idx = bugs.findIndex(currBug => currBug._id === bugId)
    if (idx === -1) return Promise.reject('Bug not found!')
    bugs.splice(idx, 1)
    return _saveBugsToFile()
}