# Mostly-LFS
Githooks for when most of your project is not text files.

Imagine a world where you use git for everything and as most files don't diff that nice, you use lfs to keep your repo actions speedy!
The problem is that it is very easy to push a large binary file to your public repo without using git LFS (😱).

This project comes to the rescue by providing a pre-commit hook to check that any files which are not tracked already or are in a `.gitlfsignore` file.

It uses husky to offer a node based solution.

## Getting started
* Make sure you have [Node ^8.0](https://nodejs.org/en/download/current/) installed
* Optionally install yarn with `npm install -g yarn`
* Fork this repo or take a shallow clone into a differently named folder (if not using github)
    ```bash
    # shallow clone the repo
    git clone https://github.com/j-medland/mostly-lfs --depth 1 my-project-name

    # cd into the new folder
    cd my-project-name

    # remove git
     rm -rf .git

    # re-initialize git
    git init

    # setup your remote
    git remote add origin <some-remote-repo>
    ```
* Run `npm install` to install the project dependencies
* Push your commits with gay abandon (you will need to `--set-upstream` on the first one)

## .gitlfsignore File
This works in a very similar way to the .gitignore file via friendly glob patterns.
For instance:
* `**/*.js` matches any .js file in any directory
* `node_modules/` will ignore any file in the node_modules directory

Files which match the .gitlfsignore patterns will be excused the use of git-lfs.

## Console/Terminal Ouput
You should be able to see the pre-push hook working with the following output 
```bash
λ git push --set-upstream origin master
    husky > pre-push (node v8.7.0)
    **RUNNING CUSTOM PRE-PUSH CHECKS**
    **PRE-PUSH CHECKS OK** 👍
    Counting objects: 11, done.
    Delta compression using up to 4 threads.
    Compressing objects: 100% (8/8), done.
    Writing objects: 100% (11/11), 6.36 KiB | 0 bytes/s, done.
    Total 11 (delta 0), reused 0 (delta 0)
```