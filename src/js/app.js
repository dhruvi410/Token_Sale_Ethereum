App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,
  
    initMetamask: function() {
    async function enableUser(){
      const accounts = await ethereum.enable();
      const account = accounts[0]
      App.account = account
    }
    enableUser()
  },
    init: function () {
        console.log("App initialized...")
        return App.initWeb3();
    },
    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = ethereum;
            web3 = new Web3(ethereum);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContracts();
    },
    initContracts: function () {
        $.getJSON("TJDtokensale.json", function (TJDtokensale) {
            App.contracts.TJDtokensale = TruffleContract(TJDtokensale);
            App.contracts.TJDtokensale.setProvider(App.web3Provider);
            App.contracts.TJDtokensale.deployed().then(function (TJDtokensale) {
                console.log("TJD Token Sale Address:", TJDtokensale.address);
            });
        }).done(function () {
            $.getJSON("TJDtoken.json", function (TJDtoken) {
                App.contracts.TJDtoken = TruffleContract(TJDtoken);
                App.contracts.TJDtoken.setProvider(App.web3Provider);
                App.contracts.TJDtoken.deployed().then(function (TJDtoken) {
                    console.log("TJD Token Address:", TJDtoken.address);
                });
                App.listenForEvents();
                return App.render();
            });
        })
    },
     listenForEvents: function() {
    App.contracts.TJDtokensale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },
    render: function () {
        if (App.loading) {
            return;
        }
        App.loading = true;
        var loader = $('#loader');
        var content = $('#content');

        loader.show();
        loader.hide();

        ethereum.request({ method: 'eth_requestAccounts' }).then(function (acc) {
            App.account = acc[0];
            $("#accountAddress").html("Your Account: " + App.account);
            App.loading = false;
            loader.hide();
            content.show();
        });

        // Load token sale contract
        App.contracts.TJDtokensale.deployed().then(function (instance) {
            TJDtokensaleInstance = instance;
            return TJDTokenSaleInstance.tokenPrice();
        }).then(function (tokenPrice) {
            App.tokenPrice = tokenPrice;
            $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
            return TJDTokenSaleInstance.tokensSold();
        }).then(function (tokensSold) {
            App.tokensSold = tokensSold.toNumber();
            $('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent + '%');

            App.contracts.TJDtoken.deployed().then(function (instance) {
                TJDTokenInstance = instance;
                return TJDTokenInstance.balanceOf(App.account);
            }).then(function (balance) {
                $('.TJD-balance').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            })
        });

    },

    listenForEvents: function () {
        App.contracts.TJDtokensale.deployed().then(function (instance) {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest',
            }).watch(function (error, event) {
                console.log("event triggered", event);
                App.render();
            })
        })
    },
    buyTokens: function () {
        $('#content').hide();
        $('#loader').show();
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.TJDtokensale.deployed().then(function (instance) {
            return instance.buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000 // Gas limit
            });
        }).then(function (result) {
            console.log("Tokens bought...")
            $('form').trigger('reset') // reset number of tokens in form
            // Wait for Sell event
        });
    }
}

$(function () {
    $(window).load(function () {
        App.init();
    })
});