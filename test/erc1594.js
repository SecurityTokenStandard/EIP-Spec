import { catchRevert } from "./helpers/exceptions";
import { takeSnapshot, revertToSnapshot } from "./helpers/time";

const ERC1594Token = artifacts.require('./ERC1594Token.sol');

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ERC1594", accounts => {
    
let tokenOwner;
let controller;
let tokenHolder1;
let tokenHolder2;
let erc1594Token;

const empty_data = "0x0000000000000000000000000000000000000000";
const zero_address = "0x0000000000000000000000000000000000000000";

    before(async () => {
        tokenHolder1 = accounts[3];
        tokenHolder2 = accounts[2];
        controller = accounts[5];
        tokenOwner = accounts[4];

        erc1594Token = await ERC1594Token.new("Token", "TOKEN", 18, {from: tokenOwner});
    });

    describe(`Test cases for the ERC1594 contract\n`, async () => {

      describe(`Test cases for the issuance\n`, async() => {

        it("\tShould check the value of the issuance variable\n", async() => {
            let issuance = await erc1594Token.isIssuable.call();
            assert.isTrue(issuance);
        });
  
        it("\tShould fail in issue the tokens to the token holders because msg.sender is not the owner or operator\n", async() => {
            await catchRevert(
                erc1594Token.issue(tokenHolder1, web3.utils.toWei("100"), empty_data, {from: tokenHolder2})
            );
        });
  
        it("\tShould fail in issuance the tokens because to address is zero address\n", async() => {
            await catchRevert(
                erc1594Token.issue(zero_address, web3.utils.toWei("100"), empty_data, {from: tokenOwner})
            );
        });
  
        it("\tShould successfully issue the tokens to the token holder and verified the data of `Issued` event\n", async() => {
            let tx = await erc1594Token.issue(tokenHolder1, web3.utils.toWei("1000"), empty_data, {from: tokenOwner});
            assert.equal(tx.logs[1].args._operator, tokenOwner);
            assert.equal(tx.logs[1].args._to, tokenHolder1);
            assert.equal((tx.logs[1].args._value).toNumber(), web3.utils.toWei("1000"));

            // verify the balance
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder1)).toNumber(), web3.utils.toWei("1000"));
            assert.equal((await erc1594Token.totalSupply.call()).toNumber(), web3.utils.toWei("1000"));
        });

        // it("Should fail to issue 2^256 -1 tokens", async() => {
        //   console.log(((new BigNumber(2).pow(256)).minus(new BigNumber(1))).toNumber());
        //   await catchRevert(
        //       erc1594Token.issue(tokenHolder2, (new BigNumber(2).pow(256)).minus(new BigNumber(1)), empty_data, {from: tokenOwner})
        //   );
        // })
  
        it("\tShould successfully issue tokens to more token holder\n", async() => {
            let tx = await erc1594Token.issue(tokenHolder2, web3.utils.toWei("500"), empty_data, {from: tokenOwner});
            assert.equal(tx.logs[1].args._operator, tokenOwner);
            assert.equal(tx.logs[1].args._to, tokenHolder2);
            assert.equal((tx.logs[1].args._value).toNumber(), web3.utils.toWei("500"));

            // verify the balance
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder2)).toNumber(), web3.utils.toWei("500"));
            assert.equal((await erc1594Token.totalSupply.call()).toNumber(), web3.utils.toWei("1500"));
        });
  
        it("\tShould finalize the issuance by calling finalizeIssuance() function but get failed because msg.sender is not authorised\n", async() => {
            await catchRevert(
                erc1594Token.finalizeIssuance({from: tokenHolder1})
            );
        });
  
        it("\tShould finalize the issuance by calling finalizeIssuance() function\n", async() => {
            await erc1594Token.finalizeIssuance({from: tokenOwner});
            assert.isFalse(await erc1594Token.isIssuable.call());
        });
  
        it("\tShould failed to issue more tokens because issuance is finalized\n", async() => {
            await catchRevert(
                erc1594Token.issue(tokenHolder2, web3.utils.toWei("100"), empty_data, {from: tokenOwner})
            );
        });
  
        it("\tShould try to call the finalizeIssuance() again but get revert as issuance is already finalized\n", async() => {
            await catchRevert(
              erc1594Token.finalizeIssuance({from: tokenOwner})
            );
        });
      });

      describe("Test cases for the transfer functions\n", async() => {

        it("\tShould fail to transfer the tokens when the `from` doesn't have the sufficient balance\n", async() => {
            let data = await erc1594Token.canTransfer.call(tokenHolder2, web3.utils.toWei("1100"), empty_data, {from: tokenHolder1});
            
            assert.isFalse(data[0]);
            assert.equal(data[1], 0x52);

            await catchRevert(
                erc1594Token.transferWithData(tokenHolder2, web3.utils.toWei("1100"), empty_data, {from: tokenHolder1})
            );
        });

        it("\tShould fail to transfer the tokens when `to` address is zero address\n", async() => {
            let data = await erc1594Token.canTransfer.call(zero_address, web3.utils.toWei("110"), empty_data, {from: tokenHolder1});
            
            assert.isFalse(data[0]);
            assert.equal(data[1], 0x57);

            await catchRevert(
                erc1594Token.transferWithData(zero_address, web3.utils.toWei("110"), empty_data, {from: tokenHolder1})
            );
        });

        it("\tShould successfully transfer the tokens from one holder to another and verify the `Transfer` event data\n", async() => {
            let data = await erc1594Token.canTransfer.call(tokenHolder2, web3.utils.toWei("100"), empty_data, {from: tokenHolder1});

            assert.isTrue(data[0]);
            assert.equal(data[1], 0x51);

            let tx = await erc1594Token.transferWithData(tokenHolder2, web3.utils.toWei("100"), empty_data, {from: tokenHolder1});
            assert.equal(tx.logs[0].args.from, tokenHolder1);
            assert.equal(tx.logs[0].args.to, tokenHolder2);
            assert.equal((tx.logs[0].args.value).toNumber(), web3.utils.toWei("100"));
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder2)).toNumber(), web3.utils.toWei("600"));
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder1)).toNumber(), web3.utils.toWei("900"));
        });

        it("\tShould fail to transfer the tokens because of the insufficient allowance (transferFrom)\n", async() => {
            let data = await erc1594Token.canTransferFrom.call(tokenHolder1, tokenHolder2, web3.utils.toWei("200"), empty_data, {from: controller});
                
            assert.isFalse(data[0]);
            assert.equal(data[1], 0x53);

            await catchRevert(
                erc1594Token.transferFromWithData(tokenHolder1, tokenHolder2, web3.utils.toWei("200"), empty_data, {from: controller})
            );
        });

        it("\tShould successfull transfer the tokens (transferFrom)\n", async() => {
            await erc1594Token.approve(controller, web3.utils.toWei("500"), {from: tokenHolder1});
            let data = await erc1594Token.canTransferFrom.call(tokenHolder1, tokenHolder2, web3.utils.toWei("200"), empty_data, {from: controller});
                  
            assert.isTrue(data[0]);
            assert.equal(data[1], 0x51);

            let tx = await erc1594Token.transferFromWithData(tokenHolder1, tokenHolder2, web3.utils.toWei("200"), empty_data, {from: controller});
            assert.equal(tx.logs[0].args.from, tokenHolder1);
            assert.equal(tx.logs[0].args.to, tokenHolder2);
            assert.equal((tx.logs[0].args.value).toNumber(), web3.utils.toWei("200"));
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder2)).toNumber(), web3.utils.toWei("800"));
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder1)).toNumber(), web3.utils.toWei("700"));
        });
      });

      describe("Test cases for the redeem functions\n", async() => {

        it("\tShould failed to redeem the tokens because balance is less than the value\n", async() => {
            await catchRevert(
                erc1594Token.redeem(web3.utils.toWei("1200"), empty_data, {from: tokenHolder2})
            );
        });

        it("\tShould successfully redeem the tokens by the msg.sender\n", async() => {
            let tx = await erc1594Token.redeem(web3.utils.toWei("200"), empty_data, {from: tokenHolder2});

            assert.equal(tx.logs[1].args._operator, zero_address);
            assert.equal(tx.logs[1].args._from, tokenHolder2);
            assert.equal((tx.logs[1].args._value).toNumber(), web3.utils.toWei("200"));

            assert.equal((await erc1594Token.totalSupply.call()).toNumber(), web3.utils.toWei("1300"));
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder2)).toNumber(), web3.utils.toWei("600"));
        });

        it("\tShould fail the redeem tokens because sufficient alowance is not provided (redeemFrom)\n", async() => {
            await catchRevert( 
                erc1594Token.redeemFrom(tokenHolder2, web3.utils.toWei("100"), empty_data, {from: controller})
            );
        });

        it("\tShould fail to redeem the tokens because `to` address is the zero type address\n", async() => {
            await erc1594Token.approve(controller, web3.utils.toWei("100"), {from: tokenHolder2});
            await catchRevert( 
              erc1594Token.redeemFrom(zero_address, web3.utils.toWei("100"), empty_data, {from: controller})
            );
        });

        it("\tShould successfully redeem the tokens (redeemFrom)\n", async() => {
            let tx = await erc1594Token.redeemFrom(tokenHolder2, web3.utils.toWei("100"), empty_data, {from: controller})
            
            assert.equal(tx.logs[1].args._operator, controller);
            assert.equal(tx.logs[1].args._from, tokenHolder2);
            assert.equal((tx.logs[1].args._value).toNumber(), web3.utils.toWei("100"));

            assert.equal((await erc1594Token.totalSupply.call()).toNumber(), web3.utils.toWei("1200"));
            assert.equal((await erc1594Token.balanceOf.call(tokenHolder2)).toNumber(), web3.utils.toWei("500"));
        });
      });
    });

  });