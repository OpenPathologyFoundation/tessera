/**
 * Created by emilypatonay on 5/19/15.
 */


// HANDLEBARS HELPERS

// OTHER FUNCTIONS
(function ($) {

    app.tools = {

        resetCounter: function (specType) {
            // This will allow the counters to all be set to 0
            // to start the script
            var x = 'table.' + specType;
            $(x).find('.cellAmount').val(0);
            $(x).find('.percentCell').text(0);
            $(x).find('#percentcelltot').text('100%');
        },

        writeInstructions: function (instructions) {
            $('div.instruct-div').html(instructions);
        },
        toggleSpecType: function (toType) {
            // Hide one specimen type and show the other
            console.log('Switching to ' + toType);
            switch (toType)
            {
                case 'bm':
                    var hideType = 'pb';
                    break;
                case 'pb':
                    var hideType = 'bm';
                    break;
            }
            console.log('Hiding ' + hideType);
            $('.' + toType).removeClass('hidden');
            $('.' + hideType).addClass('hidden');
        }
    };

    app.utils = {

        addToCell: function (whichCell) {
            // This function takes the data from the listener
            // below and adds one to each cell when that button
            // is pressed

            /*
            * Because there are two specimen types by default (bm and pb),
            * the specTypes variable will contain both. I can then iterate
            * over each of them and run through this method twice.
            * */

            // TODO: create the specTypes array from the model that loads from templates.json
            var specTypes = ['bm', 'pb'];
            _.each(specTypes, function (item) {
                var whichTable = 'table.' + item;
                (function (whichTable, whichCell) {
                    var curAmount, newAmount, curTot, newTot, totCell, wchCellStr, findCell;
                    wchCellStr = "#numcell" + whichCell.toUpperCase();
                    findCell = $(whichTable).find(wchCellStr);
                    curAmount = findCell.val();

                    if (curAmount != null || wchCellStr == "#numcell\t")
                    {


                        // Increase the chosen cell by one
                        newAmount = (curAmount * 1 + 1);
                        findCell.val("");
                        findCell.val(newAmount);

                        // Increase the total cell by one
                        totCell = $(whichTable).find('#numcelltot');
                        curTot = totCell.val();
                        newTot = curTot * 1 + 1;
                        totCell.val(newTot);
                        app.utils.calcPercent(whichTable, whichCell);
                    } else
                    {
                        console.log('cell not found');
                    }

                })(whichTable, whichCell);
            });
        },
        calcPercent: function (whichTable) {
            /*
            * The following goes through each percentCell in the table designated
            * by the whichTable variable.
            */
            var x = $(whichTable).find('.datacell').find('.cellAmount');
            var newPercVal;
            _.each(x, function (item) {
                var itemId = ($(item).attr('id'));
                if (itemId.substr(-3) === 'tot')
                {
                    // do nothing

                } else
                {
                    newPercVal = $(item).val() / $(whichTable + ' #numcelltot').val();
                    newPercVal = newPercVal * 100;
                    newPercVal = newPercVal.toFixed(2) + '%';

                    ($(whichTable + ' #percentcell' + itemId.substr(-1)).text(newPercVal));
                }

            })
        },

        mkOutTplJson: function (outCodes, context) {
            // First, pick out the total from the counter table in the current
            // specimen type context
            var outTplJson = {
                total: ($('table.' + context).find('#numcelltot').val()) * 1
            };

            // Make a JSON with the key being the template keyword and the value
            // being the rounded, calculated percentage value
            _.each(_.keys(outCodes), function (item) {
                outTplJson[outCodes[item]] =
                        Math.round(
                                $('table.' + context).find('#numcell' + item).val()
                                /
                                outTplJson.total * 100
                        );
            });
            // Pass this JSON object back to the calling function.
            return (outTplJson);
        },
        tabbedOutput: function () {
            $('.tab-link').on('click', function () {
                $(this).addClass('current');
                var tab_id = $(this).attr('data-tab');
                $(this).siblings().removeClass('current');
                $("#" + tab_id).addClass('current')
                        .siblings().removeClass('current');

            })
        }
    };
})(jQuery);
