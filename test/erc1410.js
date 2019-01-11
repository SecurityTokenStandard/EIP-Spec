import { catchRevert, catchInvalidOpcode } from "./helpers/exceptions";
import { takeSnapshot, revertToSnapshot } from "./helpers/time";

const ERC1410Token = artifacts.require('./ERC1410Standard.sol');

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ERC1410", accounts => {
    
let tokenOwner;
let operator1;
let operator2;
let tokenHolder1;
let tokenHolder2;
let erc1410Token;
const partition1 = "Debt";
const partition2 = "Equity";
const partition3 = "locked";

const empty_data = "0x0000000000000000000000000000000000000000";
const zero_address = "0x0000000000000000000000000000000000000000";

    before(async () => {
        tokenHolder1 = accounts[3];
        tokenHolder2 = accounts[2];
        operator1 = accounts[5];
        operator2 = accounts[6];
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

            it("\t Should issue more tokens to the same token holder \n", async() => {
                await erc1410Token.issueByPartition(partition1, tokenHolder1, web3.utils.toWei("20"), "0x0", {from: tokenOwner});

                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 30);
                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder1)).toString()), 30);
                
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition1, tokenHolder1)).toString()),
                    30
                );
                assert.equal(
                    (await erc1410Token.partitionsOf(tokenHolder1)).length, 1
                );
                assert.equal(
                    web3.utils.toUtf8((await erc1410Token.partitionsOf(tokenHolder1))[0]),
                    partition1
                );
            });


            it("\t Should issue some more tokens to another token holder of the same partition \n", async() => {
                await erc1410Token.issueByPartition(partition1, tokenHolder2, web3.utils.toWei("50"), "0x0", {from: tokenOwner});

                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 80);
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

            it("\t Should failed to issue tokens by partition because of unauthorised msg.sender \n", async() => {
                await catchRevert(
                    erc1410Token.issueByPartition(partition1, tokenHolder1, web3.utils.toWei("10"), "0x0", {from: operator1})
                );
            });

            it("\t Should failed to issue tokens because of invalid partition \n", async() => {
                await catchRevert(
                    erc1410Token.issueByPartition("0x0", tokenHolder1, web3.utils.toWei("10"), "0x0", {from: tokenOwner})
                );
            });

            it("\t Should failed to issue tokens because reciever address is 0x \n", async() => {
                await catchRevert(
                    erc1410Token.issueByPartition(partition1, zero_address, web3.utils.toWei("10"), "0x0", {from: tokenOwner})
                );
            });

            it("\t Should failed to issue tokens because value is 0 \n", async() => {
                await catchRevert(
                    erc1410Token.issueByPartition(partition1, tokenHolder2, 0, "0x0", {from: tokenOwner})
                );
            });
        });

        describe("Transfer the tokens (transferByPartition)", async() => {

            it("\t Should transfer the tokens from token holder 1 to token holder 2 \n", async() => {
                let tx = await erc1410Token.transferByPartition(partition1, tokenHolder1, web3.utils.toWei("5"), "", {from: tokenHolder2});

                // verify the event
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._fromPartition), partition1);
                assert.equal(tx.logs[0].args._operator, zero_address);
                assert.equal(tx.logs[0].args._from, tokenHolder2);
                assert.equal(tx.logs[0].args._to, tokenHolder1);
                assert.equal(web3.utils.fromWei((tx.logs[0].args._value).toString()), 5);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._data), "");
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._operatorData), "");
            });

            it("\t Should transfer the tokens from token holder 2 to token holder 1 \n", async() => {
                let tx = await erc1410Token.transferByPartition(partition1, tokenHolder2, web3.utils.toWei("10"), "", {from: tokenHolder1});

                // verify the event
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._fromPartition), partition1);
                assert.equal(tx.logs[0].args._operator, zero_address);
                assert.equal(tx.logs[0].args._from, tokenHolder1);
                assert.equal(tx.logs[0].args._to, tokenHolder2);
                assert.equal(web3.utils.fromWei((tx.logs[0].args._value).toString()), 10);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._data), "");
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._operatorData), "");

                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder2)).toString()), 55);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition1, tokenHolder2)).toString()),
                    55
                );
            });

            it("\t Should fail to transfer the tokens from a invalid partition\n", async() => {
                await catchRevert(
                    erc1410Token.transferByPartition("locked", tokenHolder2, web3.utils.toWei("10"), "", {from: tokenHolder1})
                );
            });

            it("\t Should fail to transfer when partition balance is insufficient\n", async() => {
                await catchRevert(
                    erc1410Token.transferByPartition(partition1, tokenHolder2, web3.utils.toWei("30"), "", {from: tokenHolder1})
                );
            });

            it("\t Should fail to transfer when reciever address is 0x\n", async() => {
                await catchRevert(
                    erc1410Token.transferByPartition(partition1, zero_address, web3.utils.toWei("10"), "", {from: tokenHolder1})
                );
            });

            it("\t Should issue more tokens of different partitions to token holder 1 & 2\n", async() => {
                await erc1410Token.issueByPartition(partition2, tokenHolder1, web3.utils.toWei("20"), "0x0", {from: tokenOwner});

                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 100);
                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder1)).toString()), 45);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition2, tokenHolder1)).toString()),
                    20
                );
                assert.equal(
                    (await erc1410Token.partitionsOf(tokenHolder1)).length, 2
                );
                assert.equal(
                    web3.utils.toUtf8((await erc1410Token.partitionsOf(tokenHolder1))[1]),
                    partition2
                );

                await erc1410Token.issueByPartition(partition3, tokenHolder2, web3.utils.toWei("30"), "0x0", {from: tokenOwner});

                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 130);
                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder2)).toString()), 85);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition3, tokenHolder2)).toString()),
                    30
                );
                assert.equal(
                    (await erc1410Token.partitionsOf(tokenHolder2)).length, 2
                );
                assert.equal(
                    web3.utils.toUtf8((await erc1410Token.partitionsOf(tokenHolder2))[1]),
                    partition3
                );
            });

            it("\t Should fail to transfer the tokens from a partition because reciever doesn't have the partition tokens\n", async() => {
                await catchInvalidOpcode(
                    erc1410Token.transferByPartition(partition2, tokenHolder2, web3.utils.toWei("3"), "", {from: tokenHolder1})
                );
            });
        });

        describe("Test cases for verifying the output of canTransferByPartition()", async() => {

            it("\t Should transfer the tokens from token holder 1 to token holder 2 \n", async() => {
                let op = await erc1410Token.canTransferByPartition.call(tokenHolder2, tokenHolder1, partition1, web3.utils.toWei("5"), "");
                assert.equal(op[0], 0x51);
                assert.equal(web3.utils.toUtf8(op[1]), "Success");
                assert.equal(web3.utils.toUtf8(op[2]), partition1);
            })

            it("\t Should transfer the tokens from token holder 2 to token holder 1 \n", async() => {
                let op = await erc1410Token.canTransferByPartition.call(tokenHolder1, tokenHolder2, partition1, web3.utils.toWei("10"), "");
                assert.equal(op[0], 0x51);
                assert.equal(web3.utils.toUtf8(op[1]), "Success");
                assert.equal(web3.utils.toUtf8(op[2]), partition1);
            })

            it("\t Should fail to transfer the tokens from a invalid partition\n", async() => {
                let op = await erc1410Token.canTransferByPartition.call(tokenHolder1, tokenHolder2, "Vested", web3.utils.toWei("10"), "");
                assert.equal(op[0], 0x50);
                assert.equal(web3.utils.toUtf8(op[1]), "Partition not exists");
                assert.equal(web3.utils.toUtf8(op[2]), "");
            })

            it("\t Should fail to transfer when partition balance is insufficient\n", async() => {
                let op = await erc1410Token.canTransferByPartition.call(tokenHolder1, tokenHolder2, partition1, web3.utils.toWei("30"), "");
                assert.equal(op[0], 0x52);
                assert.equal(web3.utils.toUtf8(op[1]), "Insufficent balance");
                assert.equal(web3.utils.toUtf8(op[2]), "");
            })

            it("\t Should fail to transfer when reciever address is 0x\n", async() => {
                let op = await erc1410Token.canTransferByPartition.call(tokenHolder1, zero_address, partition1, web3.utils.toWei("10"), "");
                assert.equal(op[0], 0x57);
                assert.equal(web3.utils.toUtf8(op[1]), "Invalid receiver");
                assert.equal(web3.utils.toUtf8(op[2]), "");
            });
        });

        describe("Test cases for the Operator functionality", async() => {
            
            it("\t Should authorize the operator\n", async() => {
                let tx = await erc1410Token.authorizeOperator(operator1, {from: tokenHolder1});
                assert.equal(tx.logs[0].args.operator, operator1);
                assert.equal(tx.logs[0].args.tokenHolder, tokenHolder1);
            });

            it("\t Should check for the operator \n", async() => {
                assert.isTrue(await erc1410Token.isOperator.call(operator1, tokenHolder1));
            });

            it("\t Should return false by the isOperatorForPartition \n", async() => {
                assert.isFalse(await erc1410Token.isOperatorForPartition.call(partition1, operator1, tokenHolder1));
            });

            it(" \t Should transfer the tokens by OperatorByPartition\n", async() => {
                let tx = await erc1410Token.operatorTransferByPartition(
                    partition1, tokenHolder1, tokenHolder2, web3.utils.toWei("2"), "", "Lawyer", {from: operator1}
                );

                // verify the event
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._fromPartition), partition1);
                assert.equal(tx.logs[0].args._operator, operator1);
                assert.equal(tx.logs[0].args._from, tokenHolder1);
                assert.equal(tx.logs[0].args._to, tokenHolder2);
                assert.equal(web3.utils.fromWei((tx.logs[0].args._value).toString()), 2);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._data), "");
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._operatorData), "Lawyer");

                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder2)).toString()), 87);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition1, tokenHolder2)).toString()),
                    57
                );
            });

            it("\t Should fail to transfer the tokens by OperatorByPartition because of unauthorised operator\n", async() => {
                await catchRevert(
                    erc1410Token.operatorTransferByPartition(
                        partition1, tokenHolder1, tokenHolder2, web3.utils.toWei("2"), "", "Lawyer", {from: operator2}
                    )
                );
            });

            it("\t Should revoke the operator\n", async() => {
                let tx = await erc1410Token.revokeOperator(operator1, {from: tokenHolder1});
                assert.equal(tx.logs[0].args.operator, operator1);
                assert.equal(tx.logs[0].args.tokenHolder, tokenHolder1);
            });

            it("\t Should succesfully authorize the operator by partition\n", async() => {
                let tx = await erc1410Token.authorizeOperatorByPartition(partition1, operator2, {from: tokenHolder1});
                assert.equal(tx.logs[0].args.operator, operator2);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.partition), partition1);
                assert.equal(tx.logs[0].args.tokenHolder, tokenHolder1);
            });

            it("\t Should give true by isOperatorForPartition\n", async() => {
                assert.isTrue(await erc1410Token.isOperatorForPartition.call(partition1, operator2, tokenHolder1));
            });

            it("\t Should transfer the tokens usng operator\n", async() => {
                let tx = await erc1410Token.operatorTransferByPartition(
                    partition1, tokenHolder1, tokenHolder2, web3.utils.toWei("2"), "", "Lawyer", {from: operator2}
                );

                // verify the event
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._fromPartition), partition1);
                assert.equal(tx.logs[0].args._operator, operator2);
                assert.equal(tx.logs[0].args._from, tokenHolder1);
                assert.equal(tx.logs[0].args._to, tokenHolder2);
                assert.equal(web3.utils.fromWei((tx.logs[0].args._value).toString()), 2);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._data), "");
                assert.equal(web3.utils.toUtf8(tx.logs[0].args._operatorData), "Lawyer");

                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder2)).toString()), 89);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition1, tokenHolder2)).toString()),
                    59
                );
            });

            it("\t Should fail to transfer the token because operator is get revoked\n", async() => {
                let tx = await erc1410Token.revokeOperatorByPartition(partition1, operator2, {from: tokenHolder1});
                assert.equal(tx.logs[0].args.operator, operator2);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.partition), partition1);
                assert.equal(tx.logs[0].args.tokenHolder, tokenHolder1);
            });

            it("\t Should fail to transfer the tokens by OperatorByPartition because of unauthorised operator\n", async() => {
                await catchRevert(
                    erc1410Token.operatorTransferByPartition(
                        partition1, tokenHolder1, tokenHolder2, web3.utils.toWei("2"), "", "Lawyer", {from: operator2}
                    )
                );
            });
        });

        describe("Test the redeem functionality", async() => {
            
            it("\t Should fail to redeem the tokens as the value is 0 \n", async() => {
                await catchRevert(
                    erc1410Token.redeemByPartition(partition1, 0, "", {from: tokenHolder2})
                );
            });

            it("\t Should fail to redeem the tokens as the partition is 0 \n", async() => {
                await catchRevert(
                    erc1410Token.redeemByPartition(empty_data, 0, web3.utils.toWei("7"), {from: tokenHolder2})
                );
            });

            it("\t Should fail to redeem the tokens as the partition is invalid\n", async() => {
                await catchRevert(
                    erc1410Token.redeemByPartition(partition2, 0, web3.utils.toWei("7"), {from: tokenHolder2})
                );
            });

            it("\t Should fail to redeem the tokens because holder doesn't have sufficeint balance\n", async() => {
                await catchRevert(
                    erc1410Token.redeemByPartition(partition2, 0, web3.utils.toWei("70"), {from: tokenHolder2})
                );
            });

            it("\t Should successfully redeem the tokens\n", async() => {
                let tx = await erc1410Token.redeemByPartition(partition1, web3.utils.toWei("7"), "", {from: tokenHolder2});

                // verify the event
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.partition), partition1);
                assert.equal(tx.logs[0].args.operator, zero_address);
                assert.equal(tx.logs[0].args.from, tokenHolder2);
                assert.equal(web3.utils.fromWei((tx.logs[0].args.value).toString()), 7);
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.data), "");
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.operatorData), "");

                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder2)).toString()), 82);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition1, tokenHolder2)).toString()),
                    52
                );
                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 123);
            });

            it("\t Should fail to redeem tokens by the operator because token holder is zero address\n", async() => {
                await erc1410Token.authorizeOperatorByPartition(partition3, operator2, {from: tokenHolder2});
                let value = (await erc1410Token.balanceOfByPartition.call(partition3, tokenHolder2)).toString();
                await catchRevert(
                    erc1410Token.operatorRedeemByPartition(
                        partition3, zero_address, value, "", "illegal", {from: operator2}
                    )
                );
            });

            it("\t Should fail to redeem to tokens by the operator because operator is invalid\n", async() => {
                let value = (await erc1410Token.balanceOfByPartition.call(partition3, tokenHolder2)).toString();
                await catchRevert(
                    erc1410Token.operatorRedeemByPartition(
                        partition3, zero_address, value, "", "illegal", {from: operator1}
                    )
                );
            })

            it("\t Should successfully redeem tokens by the operator \n", async() => {
                
                let value = await erc1410Token.balanceOfByPartition.call(partition3, tokenHolder2);
                let tx = await erc1410Token.operatorRedeemByPartition(
                    partition3, tokenHolder2, value, "", "illegal", {from: operator2}
                );

                // verify the event
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.partition), partition3);
                assert.equal(tx.logs[0].args.operator, operator2);
                assert.equal(tx.logs[0].args.from, tokenHolder2);
                assert.equal((tx.logs[0].args.value).toString(), value.toString());
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.data), "");
                assert.equal(web3.utils.toUtf8(tx.logs[0].args.operatorData), "illegal");

                assert.equal(web3.utils.fromWei((await erc1410Token.balanceOf.call(tokenHolder2)).toString()), 52);
                assert.equal(
                    web3.utils.fromWei((await erc1410Token.balanceOfByPartition.call(partition3, tokenHolder2)).toString()),
                    0
                );
                assert.equal(
                    (await erc1410Token.partitionsOf(tokenHolder2)).length, 1
                );
                assert.equal(web3.utils.fromWei((await erc1410Token.totalSupply.call()).toString()), 93);
            });

        })
    });
});