// JavaScript Document

// Things that need to be defined first
// Getting the app ready to load the template JSON


function resetCounter () {
	// This will allow the counters to all be set to 0
	// to start the script
	console.log('resetting counter');
    $('.cellAmount').val(0);
	$('.cellPercent').text(0);
	$('#percentcelltot').text('100%');
};

function calcPercent(e) {
        // get the outCodes object from the JSON object, putting this
        // into a local variable objOutCodes.
        var objOutcodes = ysmJsonObj.outPut.outCodes;
	// This function recalculates the percentage for
	// each bio cell type, when a key is pressed.
	var percentCell = [];
	var varStr = '';
	for (var cellCode in objOutcodes) {
		varStrCell = '#numcell' + cellCode;
		varStrPercent = '#percentcell' + cellCode;
		finalCellPercent = $(varStrCell).val() /
						$('#numcelltot').val() * 100;
		$(varStrPercent).text(finalCellPercent.toFixed(2) + "%");
	};
};

function addToCell(whichCell) {
	// This function takes the data from the listener
	// below and adds one to each cell when that button
	// is presesed
	var wchCellStr = '';
	var curAmount = 0; var newAmount = 0; curTot = 0; newTot = 0;
	wchCellStr = "#numcell" + whichCell.toUpperCase();
	curAmount = $(wchCellStr).val();

	// Increase the chosen cell by one
	newAmount = (curAmount * 1 + 1);
	$(wchCellStr).val("");
	$(wchCellStr).val(newAmount);

	// Increase the total cell by one
	curTot = $('#numcelltot').val();
	newTot = curTot * 1 + 1;
	$('#numcelltot').val(newTot);
	calcPercent();
};

function makeOutput(e) {
    // First pull in the modelSentence from the JSON object.

    var modelSentence = jsonObj.outPut[e + 'Template'];
    modelSentence = modelSentence.outSentence;
    // Then, pull back in the object with the cell type and codes.
    // The cell type abbreviation should match the <span> ids in the
    // modelSentence.
    var objOutcodes = jsonObj.outPut[e + 'Template'];
    objOutcodes = objOutcodes.outCodes;
    var tmpStr = 'span#' + e + 'Out'; console.log(tmpStr);

    $(tmpStr).html(modelSentence);  // Print out the empty model sentances.

    // now employ a for-in loop to write the results to the modelSentence
    for (var cellCode in objOutcodes) {
        var varStrCell = '#numcell' + cellCode;
	var varStrPercent = '#percentcell' + cellCode;
	var finalCellPercent = $(varStrCell).val() /
					$('#numcelltot').val() * 100;
        var roundedCellPercent = (Math.round(finalCellPercent)).toString();
        if (roundedCellPercent === '0') {
            roundedCellPercent = '<1'; // All 0s made <1.
        };
       	var cellAbbr = 'span#' + e + objOutcodes[cellCode];
        $(cellAbbr).html(roundedCellPercent);

        // The current code will make the cell count always 100, since anything
        // divided by itself times 100 is 100. So, got to put that in
        // seperately.
        var valOfTotal = $('#numcelltot').val();
        var tmpStr = 'span#' + e + 'total';
        $(tmpStr).html(valOfTotal);

    };


};

function writeTblLbl(e1){
    var locOutCodes; // a local scope variable that will hold the outCodes
    //                  from the JSON file.
    //
    // The purpose of this function is to change the labels on the table.
    // For now, there are two choices: pb (peripheral blood) and bm (bone
    // marrow).

    // The argument e1 will be either 'bm' or 'pb'.

    locOutCodes = e1.outCodes;

    for (var cellCode in locOutCodes) {
        var tempVar = 'td#cell' + cellCode;
        $(tempVar).text(locOutCodes[cellCode]);
        };
    };

function updateBmPb(e){
    console.log(e);
    var tempObj = {}; var subTempObj = {}; var outObj = {};
    for (var templateId in jsonObj){
        tempObj = jsonObj[templateId];
        for (var templateData in tempObj) {
            subTempObj = tempObj[templateData];
            if (subTempObj['specType'] === e){
                writeTblLbl(subTempObj);
                break;
            }
            else { /*do nothing*/}
        };
    };
};


$(document).ready(function() {


    	$('ul.tabs li').click(function(){
		var tab_id = $(this).attr('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	})

});

$('button#btnStartCount').on('click', function(){
      console.log('User clicked Start Count button.');

      // Disabling start button because clicking twice will double the value of
      // each key stroke.
      document.getElementById('btnStartCount').disabled = true;

      // Initiate listeners for the different keys I am going to use.
      // Will need to figure out how to make a QWERTZ keyboard user able to
      // make use of this all.
      var listener = new window.keypress.Listener();
	  listener.simple_combo("a", function(){addToCell('a')});
	  listener.simple_combo("s", function(){addToCell('s')});
	  listener.simple_combo("d", function(){addToCell('d')});
	  listener.simple_combo("f", function(){addToCell('f')});
	  listener.simple_combo("z", function(){addToCell('z')});
	  listener.simple_combo("x", function(){addToCell('x')});
	  listener.simple_combo("c", function(){addToCell('c')});
	  listener.simple_combo("v", function(){addToCell('v')});
	  listener.simple_combo("b", function(){addToCell('b')});

	});

$('button#btnCountDone').on('click', function(){
    // This is the button to cause the output to be printed.
	console.log('User clicked "btnCountDone"');
	if ($('input#numtot').val() === 0) {
		alert("Please include at least one cell. Your total so far is 0.");
                location.reload();
	};

    calcPercent();
    makeOutput('pdx'); makeOutput('ysm'); makeOutput('mgh');


});


$('button#btnCountReset').on('click', function(){
    // This is the button to cause the output to be printed.
    console.log('User clicked "btnCountReset"');

    location.reload();

});

$('select#specimenType').on('change', function (){
    var locSpecType ='';
    var strOutput = "The Specimen Type has been changed to ";
    if (this.value === 'bm') {
        strOutput += 'bone marrow.';
        // If the value of the selection box gets changed to bm,
        // then call the function that updates the counter and templates,
        // passing 'bm' to that function.
        locSpecType = 'bm';
    }
    else if (this.value === 'pb'){
        // Otherwise, pass 'pb' to that function.
        strOutput += 'peripheral blood.';
        locSpecType = 'pb';
    }
    console.log(strOutput);
    updateBmPb(locSpecType);
});
