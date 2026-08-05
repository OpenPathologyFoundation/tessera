/**
 * Created by emilypatonay on 5/20/15.
 */

(function($){
    app.c.TabbedOutput = Backbone.Collection.extend({
        model: app.m.TabbedOutput
    });

    app.c.CounterTable = Backbone.Model.extend({
        url: 'settings/templates.json'
    });
})(jQuery);