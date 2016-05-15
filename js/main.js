var records = {};
var counter = 1;

if (localStorage.getItem("records") === null) {
    localStorage["records"] = JSON.stringify(records);
    localStorage["counter"] = JSON.stringify(counter);
}
else {
    records = JSON.parse(localStorage.getItem("records"));
    counter = JSON.parse(localStorage.getItem("counter"));
}

function addRecord() {
    var form_obj = document.forms["addRecordForm"];
    var obj = {
        band:form_obj["band"].value,
        album:form_obj["album"].value,
        year:form_obj["year"].value,
        rating:form_obj["rating"].value
    };

    records[counter] = obj;
    counter += 1;
    localStorage["records"] = JSON.stringify(records);
    localStorage["counter"] = JSON.stringify(counter);
}

function constructTableRow(record, recordKey) {
    var table = document.getElementById("table-records");
    var row = table.insertRow(table.rows.length);
    var content = ["band", "album", "year", "rating"];

    for (var i = 0; i < 4; i++) {
        var temp = row.insertCell(i);
        temp.textContent = record[content[i]];
        temp.addEventListener("click", (function(index) {
                    return function() {
                            var newValue = prompt("Please enter the new value");
                            if (newValue === null || newValue == "") {
                                return
                            }

                            record[content[index]] = newValue;
                            localStorage["records"] = JSON.stringify(records);
                            location.reload();
                        }
                    }
            )(i)
        )

    }

    var buttonTd = row.insertCell(i);
    var button = document.createElement("button");
    button.textContent = "Delete";
    button.className += "btn btn-danger";
    button.addEventListener("click", function() {
            delete records[recordKey];
            localStorage["records"] = JSON.stringify(records);
            location.reload();
        }
    )
    buttonTd.appendChild(button);

}

function renderRecords() {
    var average = 0;
    var maximum = 0;
    var total = 0;

    for (var recordKey in records) {
        if (records.hasOwnProperty(recordKey)) {
            console.log(records[recordKey]);
            record = records[recordKey]
            constructTableRow(record, recordKey);
            var rating = parseInt(record["rating"]);
            if (rating > maximum) {
                maximum = rating;
            }
            average += rating;
            total += 1;
        }
    }

    average = average / total;
    var averageText = document.getElementById("average-rating");
    var maximumText = document.getElementById("maximum-rating");

    if (maximum == 0) {
        maximum = "undefined";
        average = "undefined";
        averageText.className += "alert alert-warning"
        maximumText.className += "alert alert-warning"
    }


    averageText.textContent += average + ".";
    maximumText.textContent += maximum + ".";


}
