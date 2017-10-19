const test = require('tape-async')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs')
const path = require('path')


function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time))
}

test('catches new files', async t => {
    // write a .bigfile
    const newFileName = path.join(__dirname, 'example.bigfile')
    try {
        fs.writeFileSync(newFileName, 'I AM A BIG FILE')
    } catch (e) {
        //ignore any file already exsists
    }

    // add and commit
    let thrownError = null

    await exec(`git add ${newFileName}`)
    console.log('COMMITING .bigfile')
    const commit = await exec(`git commit -m "Test commit: .bigfile File added"`)
        //test hook
    try {
        await exec('npm run pre-push --silent')
    } catch (e) {
        thrownError = e
    }
    if (commit.stdout) {
        //roll back the commit
        console.log('ROLLING BACK COMMIT')
        await exec('git reset HEAD~1')
    }
    try {
        //delete the file
        fs.unlinkSync(newFileName)
    } catch (e) {
        //ignore this error
    }
    thrownError ? t.pass('.bigfile found') : t.fail()
})

test('ignores files which are already being tracked', async t => {
    // write a .bin
    const newFileName = path.join(__dirname, 'example.bin')
    try {
        fs.writeFileSync(newFileName, 'I AM A BIG FILE')
    } catch (e) {
        //ignore any file already exsists
    }

    // add and commit
    let thrownError = null

    await exec(`git add ${newFileName}`)
    console.log('COMMITING .bin')
    const commit = await exec(`git commit -m "Test commit: .bin File added"`)
        //test hook
    try {
        await exec('npm run pre-push --silent')
    } catch (e) {
        thrownError = e
    }
    if (commit.stdout) {
        //roll back the commit
        console.log('ROLLING BACK COMMIT')
        await exec('git reset HEAD~1')
    }
    try {
        //delete the file
        fs.unlinkSync(newFileName)
    } catch (e) {
        //ignore this error
    }
    thrownError ? t.fail() : t.pass('.bin does not cause an error')
})

test('ignores renames', async t => {
    // write a .bin
    const newFileName = path.resolve(__dirname, 'test-2.bin')
    const oldFileName = path.resolve(__dirname, 'test.bin')
    fs.renameSync(oldFileName, newFileName)
        // add and commit
    let thrownError = null

    await exec(`git add ${newFileName}`)
    console.log('COMMITING filename change')
    const commit = await exec(`git commit -m "Test commit: .bin File rename"`)
        //test hook
    try {
        await exec('npm run pre-push --silent')
    } catch (e) {
        thrownError = e
    }
    if (commit.stdout) {
        //roll back the commit
        console.log('ROLLING BACK COMMIT')
        await exec('git reset HEAD~1')
    }
    try {
        //swap name back
        fs.renameSync(newFileName, oldFileName)
    } catch (e) {
        //ignore this error
    }
    thrownError ? t.fail() : t.pass('.bin does not cause an error')
})