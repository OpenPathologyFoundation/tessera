<%--
  Created by IntelliJ IDEA.
  User: pg86
  Date: 6/4/15
  Time: 8:13 AM
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>Making a Table</title>
  <link rel="stylesheet" type="text/css" href="libraries/jquery-ui-1.11.4/jquery-ui.css">
  <link rel="stylesheet" type="text/css" href="styles/landing-style.css">
  <link rel="stylesheet" type="text/css" href="styles/counter.css">

</head>
<body>

<div class='header-cont'>
  <header class='masthead'>
    <h1 id="main-title">Pathology Apps</h1>
    <nav id='masthead'>
      &ldquo;Manual Differential Counter&rdquo;
    </nav>
  </header>
</div>

<div class="body container">
  <div class="wood">
    <div class="div-counter effect8">
      <h1 id="man-diff-title">Manual Differential Counter</h1>
      <div id="counter-tbl"></div>
      <div id ='buttons'></div>
    </div>
    <div id="output-here"></div>
  </div>
</div>

<!--TODO: Render output tabbed structure then move to inside of div.body.container-->




<!--BLOCK HDB TEMPLATE SCRIPT FOR OUTPUT-->
<script type="text/x-handlebars-template" id="tab-output-empty">
  <!--This is what to render before there is a count done-->
  {{#each data}}
  <ul>
    <li><a href='#tabs-{{tabNum}}'>{{tabName}}</a></li>
  </ul>
  {{/each}}
  {{#each data}}
  <div id="tabs-{{tabNum}}">
    <p class="instructions before-render">Instructions:<p>
    <p>Click &ldquo;Start Count&rdquo; to get going.
    <p>Once count is done, click &ldquo;Count Done&rdquo; to write results.</p>
  </div>
  {{/each}}
</script>

<script type="text/x-handlebars-template" id="tab-output">
  {{#each data}}
  <ul>
    <li><a href='#tabs-{{tabNum}}'>{{tabName}}</a></li>
  </ul>
  {{/each}}
  {{#each data}}
  <div id="tabs-{{tabNum}}">
    <p>{{tabContent}}</p>
  </div>
  {{/each}}
</script>
<!--END BLOCK HDB TEMPLATE SCRIPT FOR OUTPUT-->

<!--HDB TEMPLATE SCRIPTS FOR COUNTER TABLE-->
<script type="text/x-handlebars-template" id="table-head-tpl">
  <!--This is for the top row of the table-->
  <tr class="{{rowName}}">
    <th></th>
    {{#each data}}
    <th>{{cell}}</th>
    {{/each}}
  </tr>

</script>

<script type="text/x-handlebars-template" id="table-spinner-tpl">
  <!--This is for the row of spinners-->
  <tr class="{{rowName}}">
    <td class="lbl-column">Counter:</td>
    {{#each cellData}}
    <td>
      <input class='cellAmount' type='number'id='numcell{{{this}}}'>
    </td>
    {{/each}}
  </tr>
</script>

<script type="text/x-handlebars-template" id="table-percent-tpl">
  <tr class="{{rowName}}">
    <td class="lbl-column">Percent(%):</td>
    {{#each cellData}}
    <td id="percentcell{{{this}}}" class="percentCell"></td>
    {{/each}}
  </tr>
</script>

<script type="text/x-handlebars-template" id="table-row-tpl">
  <tr class="{{rowName}}">
    <td class="lbl-column">Keys:</td>
    {{#each cellData}}
    <td> {{{this}}} </td>
    {{/each}}
  </tr>
</script>
<!--END HDB TEMPLATE SCRIPTS FOR COUNTER TABLE-->

<!--BLOCK TPL FOR THE BUTTONS-->
<script type="text/x-handlebars-template" id="buttons-tpl">
  <label for="specimenType">Specimen Type</label>
  <select id="specimenType">
    <option value="bm" selected="selected">Bone Marrow</option>
    <option value="pb">Peripheral Blood</option>
  </select>
  <button id='btnStartCount'>Start Count</button>
  <button id='btnCountDone'>Count Done</button>
  <button id='btnCountReset'>Reset</button>
</script>
<!--END BLOCK TPL FOR THE BUTTONS-->

<script src="//code.jquery.com/jquery-2.1.4.js"></script>
<script src="library/handlebars-v3.0.3.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.2.0/backbone-min.js"></script>

<!--<script src="scripts/counter.js"></script>-->


<script src="scripts/defines.js"></script>
<script src="scripts/collections.js"></script>
<script src="scripts/models.js"></script>
<script src="scripts/views.js"></script>
<script src="scripts/app.js"></script>
<script src="scripts/routes.js"></script>
<script>

  $(document).ready(function(){
    /*
     Make the value of specimen type available in th app.v name space.
     Change it when the value changes.
     */
    var element;
    element = $('#specimenType');
    app.v.specType = element.val();
    element.on('change', function(ev){
      ev.preventDefault();
      app.v.specType = element.val();
    });

  })

</script>

</body>
</html>
