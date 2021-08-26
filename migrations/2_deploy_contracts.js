var TJDtoken = artifacts.require("./contracts/TJDtoken.sol");
var TJDtokenSale = artifacts.require("./TJDtokenSale.sol");
module.exports = function(deployer) {

deployer.deploy (TJDtoken,1000000).then(function(){
	var tokenPrice = 1000000000000000;
    return deployer.deploy(TJDtokenSale, TJDtoken.address, tokenPrice);
  });

};

