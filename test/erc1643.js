import { catchRevert } from "./helpers/exceptions";
import { takeSnapshot, revertToSnapshot } from "./helpers/time";

const ERC1643 = artifacts.require('./ERC1643.sol');

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ERC1643", accounts => {
    
let tokenOwner;
let account1;
let account2;
let erc1643;
const uri = "https://www.gogl.bts.fly";
const docHash = "hello";

const empty_hash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    async function latestTime() {
        return (await web3.eth.getBlock("latest")).timestamp;
    }
    
    before(async () => {
        account1 = accounts[3];
        account2 = accounts[2];
        tokenOwner = accounts[4];

        // Deploy the ERC1643 contract
        erc1643 = await ERC1643.new({from: tokenOwner});
    });

    describe(`Test cases for the ERC1643 contract\n`, async () => {

        describe(`Test cases for the setDocument() function of the ERC1643\n`, async() => {

            it("\tShould failed in executing the setDocument() function because msg.sender is not authorised\n", async() => {
                await catchRevert(
                    erc1643.setDocument("doc1", "https://www.gogl.bts.fly", "0x0", {from: account1})
                );
            });

            it("\tShould failed to set a document details as name is empty\n", async() => {
                await catchRevert(
                    erc1643.setDocument("", "https://www.gogl.bts.fly", "0x0", {from: tokenOwner})
                );
            });

            it("\tShould failed to set a document details as URI is empty\n", async() => {
                await catchRevert(
                    erc1643.setDocument("doc1", "", "0x0", {from: tokenOwner})
                );
            });

            it("\tShould sucessfully add the document details in the `_documents` mapping and change the length of the `_docsNames`\n", async() => {
                let tx = await erc1643.setDocument("doc1", uri, docHash, {from: tokenOwner});
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "doc1");
                assert.equal(tx.logs[0].args._uri, uri);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._documentHash), docHash);
                assert.equal((await erc1643.getAllDocuments.call()).length, 1);
            });

            it("\tShould successfully add the new document and allow the empty docHash to be added in the `Document` structure\n", async() => {
                let tx = await erc1643.setDocument("doc2", uri, "0x0", {from: tokenOwner});
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "doc2");
                assert.equal(tx.logs[0].args._uri, uri);
                assert.equal(tx.logs[0].args._documentHash, empty_hash);
                assert.equal((await erc1643.getAllDocuments.call()).length, 2);
            });

            it("\tShould successfully update the existing document and length of `_docsNames` should remain unaffected\n", async() => {
                let tx = await erc1643.setDocument("doc2", "https://www.bts.l", "0x0", {from: tokenOwner});
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "doc2");
                assert.equal(tx.logs[0].args._uri, "https://www.bts.l");
                assert.equal(tx.logs[0].args._documentHash, empty_hash);
                assert.equal((await erc1643.getAllDocuments.call()).length, 2);
            });

        describe("Test cases for the getters functions\n", async()=> {

                it("\tShould get the details of existed document\n", async() => {
                    let doc1Details = await erc1643.getDocument.call("doc1");
                    assert.equal(doc1Details[0], uri);
                    assert.equal(web3.utils.toUtf8(doc1Details[1]), docHash);
                    assert.closeTo(doc1Details[2].toNumber(), await latestTime(), 2);

                    let doc2Details = await erc1643.getDocument.call("doc2");
                    assert.equal(doc2Details[0], "https://www.bts.l");
                    assert.equal(doc2Details[1], empty_hash);
                    assert.closeTo(doc2Details[2].toNumber(), await latestTime(), 2);
                });

                it("\tShould get the details of the non-existed document it means every value should be zero\n", async() => {
                    let doc3Details = await erc1643.getDocument.call("doc3");
                    assert.equal(doc3Details[0], "");
                    assert.equal(web3.utils.toUtf8(doc3Details[1]), "");
                    assert.equal(doc3Details[2], 0);
                });

                it("\tShould get all the documents present in the contract\n", async() => {
                    let allDocs = await erc1643.getAllDocuments.call()
                    assert.equal(allDocs.length, 2);
                    assert.equal(web3.utils.toUtf8(allDocs[0]), "doc1");
                    assert.equal(web3.utils.toUtf8(allDocs[1]), "doc2");
                });
            })
        });

        describe("Test cases for the removeDocument()\n", async() => {

            it("\tShould failed to remove document because msg.sender is not authorised\n", async() => {
                await catchRevert(
                    erc1643.removeDocument("doc2", {from: account1})
                );
            });

            it("\tShould failed to remove the document that is not existed in the contract\n", async() => {
                await catchRevert(
                    erc1643.removeDocument("doc3", {from: tokenOwner})
                );
            });

            it("\tShould succssfully remove the document from the contract  which is present in the last index of the `_docsName` and check the params of the `DocumentRemoved` event\n", async() => {
                // first add the new document 
                await erc1643.setDocument("doc3", "https://www.bts.l", "0x0", {from: tokenOwner});
                // as this will be last in the array so remove this
                let tx = await erc1643.removeDocument("doc3", {from: tokenOwner});
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "doc3");
                assert.equal(tx.logs[0].args._uri, "https://www.bts.l");
                assert.equal(tx.logs[0].args._documentHash, empty_hash);
                assert.equal((await erc1643.getAllDocuments.call()).length, 2);

                // remove the document that is not last in the `docsName` array
                tx = await erc1643.removeDocument("doc1", {from: tokenOwner});
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "doc1");
                assert.equal(tx.logs[0].args._uri, uri);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._documentHash), docHash);
                assert.equal((await erc1643.getAllDocuments.call()).length, 1);
            });

            it("\t Should delete the doc to validate the #17 issue problem", async() => {
                let tx = await erc1643.removeDocument("doc2", {from: tokenOwner});
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "doc2");
                assert.equal(tx.logs[0].args._uri, "https://www.bts.l");
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._documentHash), '');
                assert.equal((await erc1643.getAllDocuments.call()).length, 0);
            });

        describe("Test cases for the getters functions\n", async()=> {

            it("\tShould get the details of the non-existed (earlier was present but get removed ) document it means every value should be zero\n", async() => {
                let doc1Details = await erc1643.getDocument.call("doc1");
                assert.equal(doc1Details[0], "");
                assert.equal(web3.utils.toUtf8(doc1Details[1]), "");
                assert.equal(doc1Details[2], 0);
            });

            it("\tShould get all the documents present in the contract which should be 1\n", async() => {
                // add one doc before the getter call
                await erc1643.setDocument("doc4", "https://www.bts.l", docHash, {from: tokenOwner})
                let allDocs = await erc1643.getAllDocuments.call()
                assert.equal(allDocs.length, 1);
                assert.equal(web3.utils.toUtf8(allDocs[0]), "doc4");
            });
        });
    })
});
});