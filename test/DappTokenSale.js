const DappTokenSale = artifacts.require("DappTokenSale");
const DappToken = artifacts.require("DappToken");

contract("DappTokenSale", function (accounts) {
  const tokenPrice = 1000000000000000;

  it("Initialize contract with the correct values", async function () {
    const instance = await DappTokenSale.deployed();

    const tokenContract = await instance.tokenContract();
    const price = await instance.tokenPrice();

    assert.notEqual(instance.address, 0x0, "has contract address");
    assert.notEqual(tokenContract, 0x0, "has token contract address");

    assert.equal(price, tokenPrice, "has  contract token price");
  });

  it("should buy tokens", async function () {
    const tokenInstance = await DappToken.deployed();
    const instance = await DappTokenSale.deployed();

    const admin = accounts[0];
    const buyer = accounts[1];
    const numberOfTokens = 100;
    const value = numberOfTokens * tokenPrice;

    // Allocate initial supply tokens on sale contract address
    tokenInstance.transfer(instance.address, 1000000, { from: admin });

    const transaction = await instance.buyTokens(numberOfTokens, {
      from: buyer,
      value,
    });

    assert.equal(
      await instance.tokensSold(),
      numberOfTokens,
      `Tokens sold for ${value} ETH`
    );
    assert(transaction.logs[0].event, "Sell", "should send sell event");
  });

  it("end sale", async function () {
    const instance = await DappTokenSale.deployed();
    const admin = accounts[0];
    await instance.endSale({
      from: admin,
    });
  });
});
