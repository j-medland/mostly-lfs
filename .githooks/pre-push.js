const util = require('util')
const exec = util.promisify(require('child_process').exec)
const minimatch = require('minimatch')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

const lfsIgnoreFileName = '.gitlfsignore'
const defaultWhitelist = [lfsIgnoreFileName, '.gitattributes', '.gitignore']

// use this form of self-evaluating-function-expression as minimist causes
// issues with others
!async function() {
    console.log(chalk.magenta('**RUNNING CUSTOM PRE-PUSH CHECKS**'))
    try {
        // get list of reference names
        const refList = await gitAsArray('for-each-ref', `--format=%(refname:short)`)
            // fiter to get remote branches only
        const refs = refList.filter(ref => ref.includes('/') && !ref.includes('HEAD'))
        let filesToPush = []
            // get a list of files to push
        for (let r = 0; r < refs.length; r++) {
            // get all diffs
            const diffs = await gitAsArray('diff', `--stat --cached ${refs[r]}`, true)
                // remove the last 'status' element remove the deltas information
            const files = diffs.filter(file => file.includes('|') && !file.includes('=>')).map(diff => diff.split('|')[0].trim())
                // add unique entries to filesToPush
            files.forEach(file => {
                if (file && filesToPush.indexOf(file) == -1) {
                    filesToPush.push(file)
                }
            })
        }

        // check files under lfs
        const lfsFileList = await gitAsArray('lfs', 'ls-files')
        const filesUnderLFS = lfsFileList.filter(file => file).map(file => /[^\*\-]*$/.exec(file)[0].trim())
            // get a list of files to push not under lfs
        const nonLfsFilesToPush = filesToPush.filter(file => !filesUnderLFS.includes(file))
            // remove whitelisted files
        let whitelist = defaultWhitelist
        try {
            const lfsIgnore = fs.readFileSync(path.join(process.cwd(), lfsIgnoreFileName), 'utf-8')
            whitelist = [...defaultWhitelist, ...lfsIgnore.split('\r\n').filter(line => line && !/\s*#/.test(line))]
        } catch (error) {
            // no whitelist - ignore
        }
        // add tracked files from .gitattributes
        const gitLfsTracked = await gitAsArray('lfs', 'track')
        whitelist = [...whitelist, ...gitLfsTracked.filter(line => /^\s*\*.*/.test(line)).map(track => `**/${/\*[^\s]*/.exec(track)[0]}`)]

        // determine which files are not covered by LFS but probably should be
        const nonLfsFiles = nonLfsFilesToPush.filter(file => !whitelist.find(pattern => minimatch(file, pattern, { dot: true })))

        // alert user
        if (nonLfsFiles.length) {
            console.log(chalk.red(`The following file${nonLfsFiles.length>1 ? 's are' : ' is' } not handled by git LFS:`))
            console.log(`  ${nonLfsFiles.join(',\n  ')}`)

            console.log(
                chalk.magenta('If you would like to use the normal git protocol for these files then add rules to the ') +
                chalk.bgMagenta(lfsIgnoreFileName) +
                chalk.magenta(' file and retry this push.')
            )

            console.log(
                chalk.magenta('Alternatively use ') +
                chalk.bgMagenta(`git lfs track "*${path.extname(nonLfsFiles[0])}"`) +
                chalk.magenta(' to start using LFS for this file type.')
            )
            process.exit(1)
        }
        // if you are here then everything is good
        console.log(chalk.green('**PRE-PUSH CHECKS OK** 👍'))

    } catch (error) {
        console.log(error)
        process.exit(1)
    }

    //helper function which returns stdout and throws error on stderr
    async function git(command, options = '', suppressError = false) {
        const { stdout, stderr } = await exec(`git ${command} ${options}`)
        if (!suppressError && stderr) {
            throw new Error(`COMMAND:${command}
            ${stderr}`)
        }
        return Promise.resolve(stdout.trim())
    }

    // helper fuction to parse git <command> result as array
    async function gitAsArray(...args) {
        // run git command
        const result = await git(...args)
            // fire off promise with arrayified response
        return Promise.resolve(result.split(/[\r\n]/))
    }
}()