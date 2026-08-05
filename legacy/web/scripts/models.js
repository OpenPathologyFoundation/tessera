/**
 * Created by emilypatonay on 5/21/15.
 */

(function($){
    app.m.CounterTable = Backbone.Model.extend({
        url: 'settings/templates.json'
    });

    app.m.Test = Backbone.Model.extend({
        defaults: {
            a: 'b',
            d: 'c'
        }
    });

    app.m.TabbedOutput = Backbone.Model.extend({});

})(jQuery);