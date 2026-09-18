import fs from 'fs'

function readJsonFile(path) {
    const str = fs.readFileSync(path, 'utf8')
    const json = JSON.parse(str)
    return json
}

export const utilService = {
    readJsonFile
}