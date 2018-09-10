(function (document) {
    document.getElementById("addPower").addEventListener("click", function() {
        let powerName = document.getElementById("superPowerName").value;
        let powerDesc = document.getElementById("superPowerDescription").value;
        let insert = '<span id="'+powerName+'" class="label label-default">'+powerName+'</span>\n';
        document.getElementById("addPowerList").innerHTML += insert;
        document.getElementById("powerName").value !== '' ? document.getElementById("powerName").value += ',' + powerName : document.getElementById("powerName").value += powerName;
        document.getElementById("powerDesc").value !== '' ? document.getElementById("powerDesc").value += ',' + powerDesc : document.getElementById("powerDesc").value += powerDesc;
        document.getElementById("superPowerName").value = '';
        document.getElementById("superPowerDescription").value = '';
        document.getElementById("superPowerName").focus()
        document.getElementById(powerName).addEventListener("click", function(e) {
            let eId = e.toElement.id;
            console.log(this);
            this.parentNode.removeChild(this);
            
            let powerNameList = document.getElementById("powerName").value.split(',');
            document.getElementById("powerName").value = powerNameList.filter((power) => {
                return power !== eId
            });
        });
    });
})(document);