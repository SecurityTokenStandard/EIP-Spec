import { catchRevert } from "./helpers/exceptions";
import { takeSnapshot, revertToSnapshot } from "./helpers/time";

const ERC1410Token = artifacts.require('./ERC1410Standard.sol');

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ERC1410", accounts => {
    
let tokenOwner;
let controller;
let tokenHolder1;
let tokenHolder2;
let erc1410Token;
const partition1 = "Debt";
const partition2 = "Equity";

const empty_data = "0x0000000000000000000000000000000000000000";
const zero_address = "0x0000000000000000000000000000000000000000";

    before(async () => {
        tokenHolder1 = accounts[3];
        tokenHolder2 = accounts[2];
        controller = accounts[5];
        tokenOwner = accounts[4];

        erc1410Token = await ERC1410Token.new({from: tokenOwner});
    });

    describe(`Test cases for the ERC1410 contract\n`, async () => {

        describe(`Test cases for the issuance/Minting`, async() => {

            it("\t Should issue the tokens by the partition\n", async() => {
                await erc1410Token.issueByPartition(partition1, tokenHolder1, web3.utils.toWei("10"), "0x0", {from: tokenOwner});

                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 10);
                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder1)).toString()), 10);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition1, tokenHolder1)).toString()),
                    10
                );
                assert.equal(
                    (await erc1410Token.partitionsOf(tokenHolder1)).length, 1
                );
                assert.equal(
                    web3.utils.toUtf8((await erc1410Token.partitionsOf(tokenHolder1))[0]),
                    partition1
                );
            });

            it("\t Should failed to issue tokens by partition because of unauthorised msg.sender \n", async() => {
                await catchRevert(
                    erc1410Token.issueByPartition(partition1, tokenHolder1, web3.utils.toWei("10"), "0x0", {from: controller})
                );
            });

            it("\t Should issue some more tokens to another token holder of the same partition", async() => {
                await erc1410Token.issueByPartition(partition1, tokenHolder2, web3.utils.toWei("50"), "0x0", {from: tokenOwner});

                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 60);
                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder2)).toString()), 50);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition1, tokenHolder2)).toString()),
                    50
                );
                assert.equal(
                    (await erc1410Token.partitionsOf(tokenHolder2)).length, 1
                );
                assert.equal(
                    web3.utils.toUtf8((await erc1410Token.partitionsOf(tokenHolder2))[0]),
                    partition1
                );
            });
        });
    });
});