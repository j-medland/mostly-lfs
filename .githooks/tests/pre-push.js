const test = require('tape-async')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs')
const path = require('path')

test('catches new files', async t => {
    // write a .bigfile
    const newFileName = path.join(__dirname, 'example.bigfile')
    try {
        fs.writeFileSync(newFileName, 'I AM A BIG FILE')
    } catch (e) {
        //ignore any file already exsists
    }

    // add and commit
    let commit = null
    let prePushMessage = null
    try {
        await exec(`git add ${newFileName}`)
        commit = (await exec(`git commit -m "Test commit: File added"`)).stdout
            //test hook
        prePushMessage = (await exec('npm run pre-push --silent')).stdout
        console.log('ppm', prePushMessage)
    } catch (e) {
        console.log(e)
    }
    if (commit) {
        //roll back the commit
        await exec(`git reset HEAD~1`)
    }
    try {
        //delete the file
        fs.unlinkSync(newFileName)
    } catch (e) {
        //ignore this error
    }

    console.log(prePushMessage)
    t.equals(prePushMessage, '')
})