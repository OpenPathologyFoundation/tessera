/**
 * Created by emilypatonay on 5/19/15.
 */

(function($){
    'use strict';

    /*
    * The counter table and the output div will be rendered twice, once with a class
    * of `bm` and once with a class of `pb hidden`. There will be a router attached
    * to the `button` view that will switch between the two by moving the `hidden`
    * class around.
    */

    app.v.MakeTable = Backbone.View.extend({
        tagName: 'table',
        id: 'counter',
        template: Handlebars.compile($('#table-row-tpl').html()),
        templateHead: Handlebars.compile($('#table-head-tpl').html()),
        templateSpinner: Handlebars.compile($('#table-spinner-tpl').html()),
        templatePercent: Handlebars.compile($('#table-percent-tpl').html()),
        target:  $('#counter-tbl'), // This is the div where the rendered tpl will go
        html: '',

        initialize: function(data){
            var that = this;
            var specType = data.specimenType;

            /* SWITCH: If specType is bm className is `table bm`. If it is pb, then className
             * is `table pb hidden.
             *
             * You will have to update your class manually after the render method. Backbone
             * initializes the className of the element of your View only once time during the
             * _ensureElement method.
             * */
            switch (specType){
                case 'bm':
                    this.$el.attr('class', 'table bm');
                    that.className = 'table bm';
                    break;
                case 'pb':
                    this.$el.attr('class', 'table pb hidden');
                    that.className = 'table pb hidden';
                    break;
                default :
                    console.log('Error! `' + specType + '` is not a valid specimen type!');
            }
            this.render(data);
        },

        render: function(data) {

            /* Start making the table and output html by calling mkTitleRow (the top
            * row of the table). This method will call the rest of the methods in order,
            * including createOutputArea.*/
            this.mkTitleRow(data);
            /*
            Once all the html is made, append it to the DOM
             */
            var x = this.$el.html(this.html);
            this.target.append(x);
            app.tools.resetCounter(data.specimenType);
            return this;
        },
        mkTitleRow: function(data){
            /*
            * In order to play nice with HDB, must do a funky thing with the
            * data. See below.
            */

            var outCodes = data.outCodes;
            var keys = Object.keys(outCodes);
            var outArr = [];
            _.each(keys, function(key){
                outArr.push({key: key, cell: outCodes[key]});
            });
            outArr.push({key: null, cell: 'tot'});

            // Finally, append the row just made to the item that has been building

            this.html += (this.templateHead({rowName: 'namecell', data: outArr}));

            /* Once all this is done, the spinner row is next. Should only need to pass
            * in the value of keyboardKeys, as all the calculations will take place with
            * those keyboard keys as the hooks for the data.
            */

            this.mkSpinnerRow((_.keys(outCodes)).concat(['tot']));

            /* All is done, time to return the built up html and let the
            initialize method render stuff.
             */
            return this;
        },
        mkSpinnerRow: function(data){
            // The HDB model looks for a cellData key to iterate through to fill in
            // the columns, so I give it. Row name is the class of the row. Corresponds
            // to CSS.

            // Finally, append the row just made to the item that has been building
            this.html += (this.templateSpinner({rowName: 'datacell', cellData: data}));

            // Make the percent output row.

            this.mkPercentRow(data);

            return this;

        },
        mkPercentRow: function(data){
            // This is the callback that makes the row where the percents will be displayed
            // The template returns a row of blank cells. However, the important thing is that
            // each cell will have an id that corresponds to `percentcell` + the keyboard key
            // representing that biological cell

            // First, I'll start the row off with a label cell that says `Percent (%):`. Then,
            // rowName to be `percentrow` with a cell data of the keyboard keys. The terminating
            // cell will be labeled with an id of `tot`

            // Finally, append the row just made to the item that has been building
            this.html += (this.templatePercent({rowName: 'percentrow', cellData: data}));

            // And, then, make the key row
            this.mkKeyRow(data);

            return this
        },
        mkKeyRow: function(data){
            // Take off the 'tot' at the end of the array and replace with em dash
            data.pop();
            data = data.concat(['&mdash;']);

            // Callback that makes the bottom row
            // This is called last and appends row of keys to the end of the table

            // Adds the text `Percent (%):` to a cell in front and an extra cell
            // at the end containing an em dash
            // The HDB model looks for a cellData key to iterate through to fill in
            // the columns, so I give it. Row name is the class of the row. Corresponds
            // to CSS.

            // Finally, append the row just made to the item that has been building
            this.html += (this.template({rowName: 'keys', cellData: data}));

            return this;
        }
    });

    app.v.CreateOuputField = Backbone.View.extend({
        tagName: 'div',
        id: 'tabs',
        className: 'output',
        html: '',
        tabTpl: Handlebars.compile(
            "<ul class='tabs'>" +
            "{{#each template}}" +
            "<li class='tab-link {{current}}' data-tab='tab-{{@index}}'>" +
            "<img src='images/{{tplCode}}-favicon.png' class='favicon'> | " +
            "{{tplName}}</li>" +
            "{{/each}}" +
            "</ul>"
        ),
        instructHtml: "<p class='instructions'>Instructions:<p>" +
        "<p>Click &ldquo;Start Count&rdquo; to get going.</p>" +
        "<p>Once count is done, click &ldquo;Count Done&rdquo; to write results.</p>",
        outTpl: Handlebars.compile(
            "{{#each template}}" +
            "<div class='tab-content {{current}}' id='tab-{{@index}}'>" +
             "<div class='instruct-div'>x</div>" +
             "<div class='out-target hidden'>{{{outSentence}}}</div>" +
            "</div>" +
            "{{/each}}"
        ),

        // This is where the rendered output div will go
        target: $('#output-here'),

        initialize: function (data) {
            var that = this;
            var specType = data.specimenType;

            /* SWITCH: If specType is bm className is `table bm`. If it is pb, then className
             * is `table pb hidden.
             *
             * You will have to update your class manually after the render method. Backbone
             * initializes the className of the element of your View only once time during the
             * _ensureElement method.
             * */
            switch (specType){
                case 'bm':
                    this.$el.attr('class', 'output bm');
                    that.className = 'table bm';
                    break;
                case 'pb':
                    this.$el.attr('class', 'output pb hidden');
                    that.className = 'table pb hidden';
                    break;
                default :
                    console.log('Error! `' + specType + '` is not a valid specimen type!');
            }

            this.render(data);
        },

        render: function(data){
            this.mkTabs(data);
            this.target.append(this.$el.html(this.html));
            app.tools.writeInstructions(this.instructHtml);


            return this;

        },
        mkTabs: function (data) {
            /*
            * In order to render correctly, ie to make the first tab "current,"
            * there must be a `current` class. In order to do this, the script will add
            * a key: value pair of `current: 'current'` to the first entry in the
            * data.templates array of objects. The HDB template has a {{current}} tag
            * in the appropriate place that will render the word current if it is present
            * and nothing if the word is absent.
            */
            data.templates[0]['current'] = 'current';

            this.html += this.tabTpl({template: data.templates});

            // Call mkContents
            this.mkContents(data);

        },
        mkContents: function (data) {
            this.html += this.outTpl({template: data.templates});

            return this;
        }
    });

    app.v.Buttons = Backbone.View.extend({
        tagName: 'div',
        el: $('#buttons'),
        template: Handlebars.compile($('#buttons-tpl').html()),
        initialize: function(){
            this.$el.html(this.template());
        },
        events: {
            'change #specimenType': 'changeType',
            'click #btnStartCount': 'startCount',
            'click #btnCountDone': 'countDone',
            'click #btnCountReset': 'countReset'
        },
        changeType: function(){
            /*
            When the specimen type select menu changes, change both the output
            field and the table cell type labels.
             */
            var specType = $('#specimenType').val();
            app.tools.toggleSpecType(specType);
        },
        startCount: function(){
            console.log('Starting count');
            /*
             * Whenever the user clicks "Start Count," disable the button.
             * This prevents each cunt being registered as may times as the start
             * button is pressed. If you would like to play a practical joke on
             * the poor user, then trigger the start button multiple times.
             */
            document.getElementById('btnStartCount').disabled = true;

            /* Listen to keyboard keypresses. Binding to document level so that
             I don't have to worry about setting focus to anything.
             */

            $(document).keydown(function(ev){
                /* Pass in the string corresponding to the key code to the
                 adding function through a try-catch block to avoid throwing an error
                 every time a non-character key is pressed.
                 */
                try {
                    app.utils.addToCell(String.fromCharCode(ev.which));
                } catch(err) {
                    // do nothing
                }
            });
        },

        countReset: function(e)
        {
          location.reload();  
        },
        countDone: function(e){
            e.preventDefault();
            // Hide the `instruct-div`
            $('.instruct-div').addClass('hidden');

            /*
            * Go through each of the specimen types, by default only `bm` and `pb`
            */
            _.each(app.TPLJSON, function(item){
                // For each specimen type, find the output div with that specimen type.
                // Eg, '.output.pb'
                var whichSpecType = '.output.' + item.specimenType;

                $(whichSpecType).find('.out-target').each(function(i, el){
                    // Go through each, extract the inner html, and use it as a template
                    var template = Handlebars.compile($(el).html());

                    // Make the html with the mkOutTplJson results
                    var html = template(
                        app.utils.mkOutTplJson(item.outCodes, item.specimenType)
                    );

                    // Put this into the $el html
                    $(el).html(html);

                    // Unhide this $(el)
                    $(el).removeClass('hidden');
                })
            });
        }
    });

})(jQuery);