App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  loading: false,
  tokenPrice: null,
  tokensSold: 0,
  tokensAvailable: 1000000,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.send("eth_requestAccounts");
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);
    return App.initContracts();
  },

  initContracts: function () {
    $.getJSON("DappTokenSale.json", function (dappTokenSale) {
      App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
      App.contracts.DappTokenSale.setProvider(App.web3Provider);
      App.contracts.DappTokenSale.deployed().then(function (dappTokenSale) {
        console.log("Dapp Token Sale Address:", dappTokenSale.address);
      });
    }).done(function () {
      $.getJSON("DappToken.json", function (dappToken) {
        App.contracts.DappToken = TruffleContract(dappToken);
        App.contracts.DappToken.setProvider(App.web3Provider);
        App.contracts.DappToken.deployed().then(function (dappToken) {
          console.log("Dapp Token Address:", dappToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: async function () {
    const instance = await App.contracts.DappTokenSale.deployed();

    instance
      .Sell(
        {},
        {
          fromBlock: 0,
          toBlock: "latest",
        }
      )
      .watch(function (error, event) {
        App.render();
      });
  },

  render: async function () {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      console.log("account", account);

      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load token sale contract
    const tokenInstance = await App.contracts.DappToken.deployed();
    const sellInstance = await App.contracts.DappTokenSale.deployed();

    App.tokenPrice = await sellInstance.tokenPrice();
    App.tokensSold = await sellInstance.tokensSold();

    // Load token contract
    const balance = await tokenInstance.balanceOf(App.account);

    $(".token-price").html(web3.fromWei(`${App.tokenPrice}`, "ether"));
    $(".tokens-sold").html(App.tokensSold.toNumber());
    $(".tokens-available").html(App.tokensAvailable);

    var progressPercent =
      (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
    $("#progress").css("width", progressPercent + "%");

    $(".dapp-balance").html(balance.toNumber());
    App.loading = false;

    loader.hide();
    content.show();
  },

  buyTokens: async function () {
    $("#content").hide();
    $("#loader").show();
    var numberOfTokens = $("#numberOfTokens").val();

    const instance = await App.contracts.DappTokenSale.deployed();

    await instance.buyTokens(numberOfTokens, {
      from: App.account,
      value: numberOfTokens * App.tokenPrice,
    });

    console.log("Tokens bought...");
    $("form").trigger("reset");
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
