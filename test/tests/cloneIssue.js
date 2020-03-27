var path = require("path");
var assert = require("assert");
var fse = require("fs-extra");
var local = path.join.bind(path, __dirname);
var _ = require("lodash");

describe("Clone issue", function () {
    var NodeGit = require("../../");
    var Repository = NodeGit.Repository;
    var Clone = NodeGit.Clone;

    var clonePath = local("../repos/clone");

    var sshPublicKeyPath = local("../id_rsa.pub");
    var sshPrivateKeyPath = local("../id_rsa");
    var sshEncryptedPublicKeyPath = local("../encrypted_rsa.pub");
    var sshEncryptedPrivateKeyPath = local("../encrypted_rsa");

    // Set a reasonable timeout here now that our repository has grown.
    this.timeout(300000);

    beforeEach(function () {
        return fse.remove(local(`../repos`));
    });

    function updateProgressIntervals (progressIntervals, lastInvocation) {
        var now = new Date();
        if (lastInvocation) {
            progressIntervals.push(now - lastInvocation);
        }
        return now;
    }

    it("can clone with ssh while manually loading a key", function () {
        let test = function (git, path) {
            var test = this;
            var url = git;
            var opts = {
                fetchOpts: {
                    callbacks: {
                        certificateCheck: () => 0, credentials: function (url, userName) {
                            return NodeGit.Cred.sshKeyNew(userName, sshPublicKeyPath, sshPrivateKeyPath, "");
                        }
                    }
                }
            };

            let clonePath = local(`../repos/${path}`);
            return fse.remove(clonePath).then(() => Clone(url, clonePath, opts).then(function (repo) {
                assert.ok(repo instanceof Repository);
                test.repository = repo;
            }));
        };
        return Promise.all(Array(20).fill(0).map((_, i) => test.call(this, "git@github.com:nodegit/test.git", i).catch(e => console.error(e, i))));
    });
});
