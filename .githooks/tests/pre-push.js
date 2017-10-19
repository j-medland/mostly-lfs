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
        await exec(`git reset HEAD^`)
    }
    try {
        //delete the file

        fs.unlinkSync(newFileName)
    } catch (e) {
        //ignore this error
    }
    await sleep(200)
    thrownError ? t.pass('Error thrown') : t.fail()
})


test('ignores tracked files', async t => {
    // write a .bin
    const newFileName = path.join(__dirname, 'example.bin')
    try {
        fs.writeFileSync(newFileName, 'I AM A BIG FILE')
    } catch (e) {
        //ignore any file already exsists
    }

    // add and commit
    let commit = null
    let thrownError = null
    try {
        await exec(`git add ${newFileName}`)
        commit = (await exec(`git commit -m "Test commit: .bin file added"`)).stdout
            //test hook
        await exec('npm run pre-push --silent')
        console.log('ppm', prePushMessage)
    } catch (e) {
        console.log(e)
        thrownError = e
    }
    if (commit) {
        //roll back the commit
        await exec(`git reset HEAD^`)
    }
    try {
        //delete the file
        fs.unlinkSync(newFileName)
    } catch (e) {
        //ignore this error
    }
    thrownError ? t.fail() : t.pass('Error not thrown')
})