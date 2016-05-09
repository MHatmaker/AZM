﻿/**
 * Search Tool
 *
 * @class search-vm
 */

(function() {

    "use strict";

    define([
            "dojo/dom-construct",
            "dojo/_base/array",
            "dojo/_base/lang",
            "dojo/on",
            "dojo/dom-style",

            "dojo/text!app/views/search-view.html",
            "app/models/map-model",
            "app/config/searchConfig",
            "app/vm/demographic-vm",

            "esri/dijit/Search",
            "esri/layers/FeatureLayer",
            "esri/tasks/locator",
            "esri/geometry/Extent",
            "esri/symbols/PictureMarkerSymbol",
            "esri/symbols/SimpleFillSymbol",
            "esri/graphic",
            "dojo/domReady!"
        ],
        function(dc, da, lang, on, ds, view, mapModel, searchConfig, demographicVM, Search, FeatureLayer, Locator, Extent, PictureMarkerSymbol, SimpleFillSymbol, Graphic) {

            var SearchVM = new function() {

                /**
                 * Store reference to module this object.
                 *
                 * @property self
                 * @type {*}
                 */
                var self = this;

                /**
                 * Initialize the class.
                 *
                 * @method init
                 */
                self.init = function() {
                    dc.place(view, "titlebar", "after");

                    var s = new Search({
                        enableLabel: false,
                        autoNavigate: false,
                        maxSuggestions: 4,
                        enableInfoWindow: true,
                        showInfoWindowOnSelect: false,
                        sources: [],
                        map: mapModel.getMap()
                    }, "search");

                    s.set("sources", searchConfig.Sources);
                    s.startup();

                    on(s, "select-result", function(e) {
                        mapModel.clearGraphics();
                        self.UpdateMap(e);
                    });
                    on(s, "clear-search", function(e) {
                        mapModel.clearGraphics();
                    });

                }; //end init

                self.UpdateMap = function(e) {
                    if (e.result) {
                        var communityName = e.result.name;
                    }
                    var searchType = "";

                    switch (e.sourceIndex) {
                        case 1:
                            searchType = "county";
                            break;
                        case 2:
                            searchType = "supervisor";
                            break;
                        case 3:
                            searchType = "place";
                            break;
                        case 4:
                            searchType = "council";
                            break;
                    }
                    if (e.sourceIndex === 5) {
                        var symbol = mapModel.getSymbol(e.result.feature.geometry, "cyan");
                        var graphic = new Graphic(e.result.feature.geometry, symbol);
                        mapModel.addGraphic(graphic, undefined, true, true);
                    } else if (e.sourceIndex === 0) {
                        var symbol = new PictureMarkerSymbol("app/resources/img/Point.png", 36, 36).setOffset(9, 18);
                        var graphic = new Graphic(e.result.feature.geometry, symbol);
                        mapModel.addGraphic(graphic, undefined, true, true);
                    } else {
                        demographicVM.openWindow(communityName, searchType);
                    }
                };
            }; //end
            return SearchVM;
        }
    );
}());