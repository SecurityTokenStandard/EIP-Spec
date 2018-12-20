import { catchRevert } from "./helpers/exceptions";
import { takeSnapshot, revertToSnapshot } from "./helpers/time";

const ERC1644Token = artifacts.require('./ERC1594Token.sol');

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ERC1594", accounts => {
    
let tokenOwner;
let controller;
let tokenHolder1;
let tokenHolder2;
let erc1594Token;

const empty_controller = "0x0000000000000000000000000000000000000000";

    before(async () => {
        tokenHolder1 = accounts[3];
        tokenHolder2 = accounts[2];
        controller = accounts[5];
        tokenOwner = accounts[4];
    });

    describe(`Test cases for the ERC1594 contract\n`, async () => {

      describe(`Test cases for the issuance\n`, async() => {

        it("\tShould check the value of the issuance variable\n", async() => {

        });
  
        it("\tShould fail in issue the tokens to the token holders because msg.sender is not whitelisted\n", async() => {
  
        });
  
        it("\tShould fail in issuance the tokens because to address is zero address\n", async() => {
  
        });
  
        it("\tShould successfully issue the tokens to the token holder and verified the data of `Issued` event\n", async() => {
  
        });
  
        it("\tShould successfully issue tokens to more token holder\n", async() => {
  
        });
  
        it("\tShould finalize the issuance by calling finalizeIssuance() function but get failed because msg.sender is not authorised\n", async() => {
  
        });
  
        it("\tShould finalize the issuance by calling finalizeIssuance() function\n", async() => {
  
        });
  
        it("\tShould failed to issue more tokens because issuance is finalized\n", async() => {
  
        });
  
        it("\tShould try to call the finalizeIssuance() again but get revert as issuance is already finalized\n", async() => {
  
        });
      });

      describe("Test cases for the transfer functions\n", async() => {

        it("\tShould fail to transfer the tokens when the `from` doesn't have the sufficient balance\n", async() => {

        });

        it("\tShould fail to transfer the tokens when `to` address is zero address\n", async() => {

        });

        it("\tShould fail to transfer the tokens when the to address have already 2^256 -1 tokens amount\n", async() => {

        });

        it("\tShould successfully transfer the tokens from one holder to another and verify the `Transfer` event data\n", async() => {

        });

        it("\tShould fail to transfer the tokens because of the insufficient allowance (transferFrom)\n", async() => {

        });

        it("\tShould successfull transfer the tokens (transferFrom)\n", async() => {

        });
      });

      describe("Test cases for the redeem functions\n", async() => {

        it("\tShould failed to redeem the tokens because balance is less than the value\n", async() => {

        });

        it("\tShould successfully redeem the tokens by the msg.sender\n", async() => {

        });

        it("\tShould fail the redeem tokens because sufficient alowance is not provided (redeemFrom)\n", async() => {

        });

        it("\tShould fail to redeem tokens because msg.sender is not authorised (redeemFrom)\n", async() => {
        
        });

        it("\tShould fail to redeem the tokens because `to` address is the zero type address\n", async() => {

        });

        it("\tShould successfully redeem the tokens (redeemFrom)\n", async() => {

        });
      });
    });

  });