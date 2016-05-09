/**
 * Map model (contains map related properties) - Singleton
 *
 * This module is defined as a singleton object and as such,
 * contains a different architecture than other modules.
 *
 * @class map-model
 **/

(function() {

    "use strict";

    define([
        "dojo/dom-construct",
        "dojo/dom",
        "dojo/on",
        "dojo/topic",
        "dojo/query",
        "dojo/_base/connect",

        "dojo/_base/lang",
        "esri/graphic",
        "app/helpers/bookmark-delegate",

        "esri/geometry/Extent",
        "esri/geometry/Point",
        "esri/SpatialReference",

        "esri/layers/WMSLayer",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/layers/ArcGISTiledMapServiceLayer",
        "esri/layers/FeatureLayer",
        "esri/Color",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",

        "esri/dijit/Popup",
        "esri/dijit/PopupTemplate",
        "esri/InfoTemplate",

        "dojo/domReady!"
    ], function(dc, dom, on, tp, query, connect, lang, Graphic, bookmarkDelegate, Extent, Point, SpatialReference, WMSLayer, ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, FeatureLayer, Color, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Popup, PopupTemplate, InfoTemplate) {

        /**
         * Holds reference to the map.
         *
         * @property instance
         * @type {map}
         */
        var instance = null; //no globals!

        /**
         * Contains properties and methods to manage the ESRI map.
         *
         * @class MapModel
         * @constructor
         */
        function MapModel() {
            if (instance !== null) {
                throw new Error("Cannot instantiate more than one MapModel, use MapModel.getInstance()");
            }
            this.mapInstance = null;
            this.baseMapInstance = null;
            this.mapInstances = [];
            this.mapLayers = [];
            this.anonymousMapLayers = [];
            this.allowedMapLayers = [];
            this.basemapLayers = [];
            this.layerCategories = [];
            this.selectableLayers = [{
                "title": "Custom Shape"
            }];
            this.layersToAdd = [];
            this.resizeTimer;
            this.initializationData = undefined;
            this.initializing = true;
            //this.initialize();
            this.self = this;
        }

        MapModel.prototype = {

            /**
             * Initialize the class and load the map layers.
             *
             * @method initialize
             */
            initialize: function() {

                // hide div till called. vw
                // esri.hide(dojo.byId("loading"));

                this.initializationData = bookmarkDelegate.getQueryStringMapDataObj();

                /**
                 * infoTemplate for Supervisor Districts
                 * @type {InfoTemplate}
                 */
                self.superInfoTemplate = new InfoTemplate();
                self.superInfoTemplate.setTitle("Supervisor Districts");
                self.superInfoTemplate.setContent("<strong><span id='supervisorLink'>${BdName}</span></strong>");

                /**
                 * infoTemplate for Council Districts
                 * @type {InfoTemplate}
                 */
                self.councilInfoTemplate = new InfoTemplate();
                self.councilInfoTemplate.setTitle("Council Districts");
                self.councilInfoTemplate.setContent("<strong><span id='councilLink'>${WARD}</span></strong> <br> City: ${Juris}");

                /**
                 * infoTemplate for Council Districts
                 * @type {InfoTemplate}
                 */
                self.placeInfoTemplate = new InfoTemplate();
                self.placeInfoTemplate.setTitle("City/Town");
                self.placeInfoTemplate.setContent("<span id='placeLink'>${NAME10}</span>");

            },
            // =====================================================================================================================================>
            // end initialize

            loadInitialMap: function(map) {
                this.baseMapInstance = map;
                this.mapInstance = map;
                this.mapInstances.push(map);

                on(map, "LayerAddResult", this.mapOnLayerAddResult);
                on(map, "Load", lang.hitch(this, function() {
                    this.mapLoaded(map);
                }));

                var fillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 255, 255]), 2),
                    new Color([0, 255, 255, 0.25]));

                var pointSymbol = new SimpleMarkerSymbol("circle", 26, null,
                    new Color([0, 0, 0, 0.25]));

                var popup = new Popup({
                    fillSymbol: fillSymbol,
                    // lineSymbol:
                    markerSymbol: pointSymbol,
                    titleInBody: false,
                    visibleWhenEmpty: false,
                    hideDelay: -1
                }, dc.create("div"));


                this.mapInstance.infoWindow = popup;

                  /**
                 * create a link in the popup infoWindow.
                 * @type {[type]}
                 */
                var countyLink = dc.create("a", {
                    "class": "action",
                    "id": "countyInfoLink",
                    "type": "button",
                    "innerHTML": "County Summary",
                    "href": "#"
                }, query(".actionList", this.mapInstance.infoWindow.domNode)[0]);

                /**
                 * create a link in the popup infoWindow.
                 * @type {[type]}
                 */
                var placeLink = dc.create("a", {
                    "class": "action",
                    "id": "placeInfoLink",
                    "type": "button",
                    "innerHTML": "City/Town Summary",
                    "href": "#"
                }, query(".actionList", this.mapInstance.infoWindow.domNode)[0]);

                /**
                 * create a link in the popup infoWindow.
                 * @type {[type]}
                 */
                var councilLink = dc.create("a", {
                    "class": "action",
                    "id": "councilInfoLink",
                    "type": "button",
                    "innerHTML": "Council District Summary",
                    "href": "#"
                }, query(".actionList", this.mapInstance.infoWindow.domNode)[0]);

                /**
                 * create a link in the popup infoWindow.
                 * @type {[type]}
                 */
                var supervisorLink = dc.create("a", {
                    "class": "action",
                    "id": "supervisorInfoLink",
                    "type": "button",
                    "innerHTML": "Supervisor District Summary",
                    "href": "#"
                }, query(".actionList", this.mapInstance.infoWindow.domNode)[0]);

                on(placeLink, "click", this.placeLinkClicked);
                on(councilLink, "click", this.councilLinkClicked);
                on(supervisorLink, "click", this.supervisorLinkClicked);

                connect.connect(popup, "onSelectionChange", function() {
                    try {

                        var graphic = popup.getSelectedFeature();
                        if (graphic) {
                            if (graphic._layer.id === "place") {
                                $("#countyInfoLink").hide();
                                $("#placeInfoLink").show();
                                $("#councilInfoLink").hide();
                                $("#supervisorInfoLink").hide();
                            }
                            else if (graphic._layer.id === "mcCouncilDistricts") {
                                $("#countyInfoLink").hide();
                                $("#placeInfoLink").hide();
                                $("#councilInfoLink").show();
                                $("#supervisorInfoLink").hide();
                            }
                            else if (graphic._layer.id === "mcSupervisorDistricts") {
                                $("#countyInfoLink").hide();
                                $("#placeInfoLink").hide();
                                $("#councilInfoLink").hide();
                                $("#supervisorInfoLink").show();
                            }
                            else{
                                $("#countyInfoLink").hide();
                                $("#placeInfoLink").hide();
                                $("#councilInfoLink").hide();
                                $("#supervisorInfoLink").hide();
                            }

                        }
                    }
                    catch(err) {
                        $("#countyInfoLink").hide();
                        $("#placeInfoLink").hide();
                        $("#councilInfoLink").hide();
                        $("#supervisorInfoLink").hide();
                    }
                });
            },

            loadNewMap: function(map, mapInitData) {

                this.mapInstance = map;
                this.mapInstances.push(map);

                on(map, "LayerAddResult", this.mapOnLayerAddResult);
                on(map, "Load", lang.hitch(this, function() {
                    this.mapLoaded(this.mapInstance);
                }));

                this.createLayers(map);
                if (this.initializing) {
                    tp.publish("MapFrameInitialized", this.mapInstance, mapInitData);
                } else {
                    tp.publish("SelectedMapChanged", this.mapInstance);
                }

            },

            removeMap: function(map) {
                this.mapInstances.pop();
                if (this.mapInstance.id === map.id) {
                    this.mapInstance = this.baseMapInstance;
                    tp.publish("SelectedMapChanged", this.mapInstance);
                }
            },

            recenterMaps: function(centerPnt) {
                for (var i = 0; i < this.mapInstances.length; i++) {
                    this.mapInstances[i].resize(true);
                    this.mapInstances[i].reposition();
                    this.mapInstances[i].centerAt(centerPnt);
                }
            },

            syncMapExtents: function(extent, mapID) {
                for (var i = 0; i < this.mapInstances.length; i++) {
                    if (this.mapInstances[i].id !== mapID) {
                        this.mapInstances[i].setExtent(extent);
                    }
                }
            },

            /**
             * Used to coordinate popups with interactive tools
             * found in the interactiveTools-vm.js
             * @return {[type]} [description]
             */
            hideInfoWindow: function() {
                // this.mapInstance.infoWindow = false;
                this.mapInstance.infoWindow.hide();
                this.mapInstance.setInfoWindowOnClick(false);
            },

            /**
             * Used to coordinate popups with interactive tools
             * found in the demographic-vm.js
             * @return {[type]} [description]
             */
            showInfoWindow: function() {
                // this.mapInstance.infoWindow = true;
                this.mapInstance.setInfoWindowOnClick(true);
            },

            /**
             * Fired when link on Place Popup infoWindow is clicked
             * @return {[type]} [description]
             */
            placeLinkClicked: function() {
                tp.publish("placeLinkClick");
            },

            /**
             * Fired when link on Council District's Popup infoWindow is clicked
             * @return {[type]} [description]
             */
            councilLinkClicked: function() {
                tp.publish("councilLinkClick");
            },

            /**
             * Fired when link on supervisorial Popup infoWindow is clicked
             * @return {[type]} [description]
             */
            supervisorLinkClicked: function() {
                tp.publish("supervisorLinkClick");
            },


            /**
             * Fired when a layer is added to the map.
             *
             * @event onLayerAddResult
             * @param {Layer} layer - the layer added to the map.
             * @param {Error} error - any errors that occurred loading the layer.
             */
            mapOnLayerAddResult: function(layer, error) {
                if (error) {
                    alert(error);
                }
                tp.publish("mapLayerAdded");
            },

            mapLoaded: function(map) {
                tp.publish("MapLoaded", map);
            },

            /**
             * Read layer info from config.js and add the layers to the map.
             *
             * @method createLayers
             */
            createLayers: function(currentMap) {
                //for (var h = 0; h < this.mapInstances.length; h++) {
                var layersTOC = []; // add only certin layers to TOC
                var layersToAdd = [];

                for (var i = 0; i < appConfig.layerInfo.length; i++) {

                    // add all layers to TOC
                    var info = appConfig.layerInfo[i];
                    var layer;

                    var token = "";
                    if (typeof info.token !== "undefined") {
                        token = "?token=" + info.token;
                    }

                    var visible = info.visible;
                    var opacity = info.opacity;
                    if (currentMap.id !== this.baseMapInstance.id) {
                        var tempLyr = this.baseMapInstance.getLayer(info.id);
                        if (tempLyr) {
                            visible = tempLyr.visible;
                            opacity = tempLyr.opacity;
                        }
                    }

                    switch (info.type) {
                        case "wms":
                            var resourceInfo = {
                                extent: this.getMapExtent(),
                                layerInfos: info.layers,
                                version: info.version
                            };
                            var vlayers = [];
                            for (var x = 0; x < info.layers.length; x++) {
                                var li = info.layers[x];
                                vlayers.push(li.name);
                            }
                            layer = new WMSLayer(info.url, {
                                id: info.id,
                                visible: visible,
                                resourceInfo: resourceInfo,
                                visibleLayers: vlayers,
                                opacity: opacity
                            });
                            layer.setImageFormat("png");
                            break;
                        case "dynamic":
                            layer = new ArcGISDynamicMapServiceLayer(info.url + token, {
                                id: info.id,
                                visible: visible,
                                opacity: opacity
                            });
                            layer.setVisibleLayers(info.layers);
                            break;
                        case "tile":
                            layer = new ArcGISTiledMapServiceLayer(info.url + token, {
                                id: info.id,
                                visible: visible,
                                opacity: opacity
                            });
                            break;
                        case "feature":
                            var featureTemplate;
                            if (info.id === "mcSupervisorDistricts") {
                                featureTemplate = self.superInfoTemplate;
                            }
                            else if (info.id === "mcCouncilDistricts") {
                                featureTemplate = self.councilInfoTemplate;
                            }
                            else if (info.id === "place") {
                                featureTemplate = self.placeInfoTemplate;
                            }
                            layer = new FeatureLayer(info.url + token, {
                                id: info.id,
                                visible: info.visible,
                                opacity: info.opacity,
                                mode: FeatureLayer.MODE_ONDEMAND,
                                outFields: info.outFields,
                                infoTemplate: featureTemplate
                            });
                            break;
                    }

                    layer.tocIndex = i;
                    this.applyLayerProperties(layer, info);
                    layersToAdd.push(layer);

                    if (info.showTOC !== false) {
                        layersTOC.push(layer);
                    }

                    // Hack: workaround inability to create legend when appending token to url
                    //http://forums.arcgis.com/threads/65481-Legend-problems-with-secured-services-when-migrating-to-3.0-3.1
                    if (typeof info.token !== "undefined") {
                        layer.url = layer.originalUrl;
                        layer.queryUrl = layer.queryUrl + "?token=" + layer.token;
                    }
                }

                var layersReversed = layersToAdd.reverse();

                currentMap.addLayers(layersReversed);

                if (currentMap.id === this.baseMapInstance.id) {
                    // publish for base map instance and default legend
                    // console.log(layersTOC);
                    tp.publish("addTOCLayers", layersTOC);
                } else {
                    // publish for new map legends
                }
            },

            /**
             * Add additional layer properties to the layer before adding it to the map.
             *
             * @method applyLayerProperties
             * @param {Layer} layer - the layer to apply properties to.
             * @param {Object} info - the layer info object from the config.js file.
             */
            applyLayerProperties: function(layer, info) {
                layer.layerType = info.type;
                layer.layers = info.layers;
                layer.title = info.title;
                layer.description = info.description;
                layer.filters = info.filters;
                layer.category = info.category;
                layer.selectable = info.selectable;
                layer.queryUrl = info.queryUrl;
                layer.historical = info.historical;
                layer.originalUrl = info.url;
                layer.token = info.token;
                layer.queryWhere = info.queryWhere;
                layer.layerDefField = info.layerDefField;
                layer.isBasemap = (info.isBasemap) ? true : false;

                if (typeof layer.queryWhere === "undefined" || layer.queryWhere === "") {
                    layer.queryWhere = "1=1";
                }
                if (typeof info.layerDefField === "undefined") {
                    layer.layerDefField = "";
                }
                if (typeof info.historical === "undefined") {
                    layer.historical = false;
                }

                //Apply a definition expression on the layer if
                //it is a historical layer
                layer.defExp = "";
                if (layer.historical) {
                    var d = new Date();
                    d.setDate(d.getDate() - 1);
                    var curr_date = d.getDate();
                    var curr_month = d.getMonth() + 1; //Months are zero based
                    var curr_year = d.getFullYear();
                    var yesterday = curr_year + "-" + curr_month + "-" + curr_date;
                    layer.defExp = "(Date >= '" + yesterday + " 00:00:00' AND Date <= '" + yesterday + " 23:59:59')";
                }

                //Add observable properties
                layer.loading = kendo.observable(false);
                layer.isVisible = kendo.observable(layer.visible);
                layer.optionsVisible = kendo.observable(false);

                layer.refreshOpacity = function() {
                    this.opacityLevel((this.opacity * 100) + "%");
                };

                //Categorize layer
                if (layer.isBasemap) {
                    this.basemapLayers.push(layer);
                } else {
                    this.mapLayers.push(layer);
                    //this.categorizeLayer(layer);
                    if (layer.selectable) {
                        this.selectableLayers.push(layer);
                    }
                }
            },

            /**
             * Optionally categorize layers.
             *
             * @method categorizeLayer
             * @param {Layer} layer - the layer to be categorized.
             */
            categorizeLayer: function(layer) {
                var l = this.layerCategories.length;
                var exists = false;
                var obj;

                //Categorize the layer
                for (var x = 0; x < l; x++) {
                    obj = this.layerCategories[x];
                    if (obj.category === layer.category) {
                        obj.layers.push(layer);
                        if (layer.historical) {
                            obj.historical = true;
                            exists = true;
                            break;
                        }
                    }
                }

                if (!exists) {
                    var id = Math.floor(Math.random() * 1000000);
                    var d = new Date();
                    d.setDate(d.getDate() - 1);
                    var curr_date = d.getDate();
                    var curr_month = d.getMonth() + 1; //Months are zero based
                    var curr_year = d.getFullYear();
                    var yesterday = curr_year + "-" + curr_month + "-" + curr_date;
                    obj = {
                        id: id,
                        category: layer.category,
                        historical: layer.historical,
                        fromDate: yesterday,
                        toDate: yesterday,
                        layers: [layer]
                    };
                    this.layerCategories.push(obj);
                }

                //Categorize the layer filters
                l = layer.filters.length;
                var filterCategories = [];
                for (var x = 0; x < l; x++) {
                    exists = false;
                    var filter = layer.filters[x];
                    for (var y = 0; y < filterCategories.length; y++) {
                        obj = filterCategories[y];
                        if (obj.category === filter.category) {
                            obj.filters.push(filter);
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        filterCategories.push({
                            category: filter.category,
                            filters: [filter]
                        });
                    }
                }
                layer.filters = kendo.observable(filterCategories);
            },

            /**
             * Get the map instance.
             *
             * @method getMap
             * @returns {Map}
             */
            getMap: function() {
                return this.mapInstance;
            },

            /**
             * Get the graphics layer from the map.
             *
             * @method getGraphics
             * @returns {GraphicsLayer}
             */
            getGraphics: function(map) {
                var graphics;
                if (map) {
                    graphics = map.graphics;
                } else {
                    graphics = this.mapInstance.graphics;
                }

                return graphics;
            },

            /**
             * Get the spatial reference of the map.
             *
             * @method getSpatialReference
             * @returns {SpatialReference}
             */
            getSpatialReference: function() {
                return this.mapInstance.spatialReference;
            },

            /**
             * Resize the map to fit it's parent container.
             *
             * @method resizeMap
             */
            resizeMap: function() {
                if (this.mapInstance) {
                    this.mapInstance.reposition();
                    this.mapInstance.resize();
                }
            },

            /**
             * Get the current map extent.
             *
             * @method getMapExtent
             * @returns {Extent}
             */
            getMapExtent: function() {
                return this.mapInstance.extent;
            },

            /**
             * Set the map extent to the extent of the provided geometry.
             *
             * @method setMapExtent
             * @param {Geometry} geometry - source geometry for new extent.
             */
            setMapExtent: function(geometry) {
                var extent = new Extent();
                switch (geometry.type) {
                    case "extent":
                        extent = geometry;
                        break;
                    case "polygon":
                        extent = geometry.getExtent();
                        break;
                    case "point":
                        var tol = 5000;
                        extent.update(geometry.x - tol, geometry.y - tol, geometry.x + tol, geometry.y + tol);
                        extent.spatialReference = this.getSpatialReference();
                        break;
                }
                this.mapInstance.setExtent(extent, true);
            },

            /**
             * Center the map on the given point.
             *
             * @method centerMap
             * @param {Point} pt - pont to center map on.
             */
            centerMap: function(pt) {
                this.mapInstance.centerAt(pt);
            },

            /**
             * Center the map on the given latitude and longitude.
             *
             * @method centerMapAtLatLon
             * @param {number} lat - latitude uses for center point.
             * @param {number} lon - longitude used for center point.
             */
            centerMapAtLatLon: function(lat, lon) {
                var geoPt = new Point(lon, lat, new SpatialReference({
                    wkid: 102100
                }));
                var convertedPt = esri.geometry.geographicToWebMercator(geoPt);
                this.mapInstance.centerAt(convertedPt);
            },

            /**
             * Center and zoom the map on a given point.
             *
             * @method zoomToPoint
             * @param {Point} pt - point to center and zoom to.
             */
            zoomToPoint: function(pt) {
                this.mapInstance.centerAndZoom(pt, 14);
            },

            /**
             * Add a graphic to the map graphics layer.
             *
             * @method addGraphic
             * @param {Graphic} graphic - feature to be added.
             * @param {string} color - name of the color to use as a fill color.
             */
            addGraphic: function(graphic, color, hasSymbol, allMapInstances) {
                if (!hasSymbol) {
                    var symbol = this.getSymbol(graphic.geometry, color);
                    graphic.symbol = symbol;
                }
                if (allMapInstances) {
                    for (var i = 0; i < this.mapInstances.length; i += 1) {
                        var newGraphic = new Graphic(graphic.geometry, graphic.symbol, graphic.attributes, graphic.infoTemplate);
                        this.mapInstances[i].graphics.add(newGraphic);
                        newGraphic.getShape().moveToFront();
                    }
                } else {
                    this.mapInstance.graphics.add(graphic);
                }
            },

            /**
             * Add multiple graphics to the map graphics layer.
             *
             * @method addGraphics
             * @param {Graphics[]} graphics - array of features to be added.
             * @param {string} color - name of color for the graphix to be added.
             */
            addGraphics: function(graphics, color, allMapInstances) {
                if (graphics.length === 0) {
                    return;
                }
                var geometry = graphics[0].geometry;
                var symbol = this.getSymbol(geometry, color);
                for (var x = 0; x < graphics.length; x++) {
                    var g = graphics[x];
                    g.symbol = symbol;
                    if (allMapInstances) {
                        for (var i = 0; i < this.mapInstances.length; i += 1) {
                            var newGraphic = new Graphic(g.geometry, g.symbol, g.attributes, g.infoTemplate);
                            this.mapInstances[i].graphics.add(newGraphic);
                            if (newGraphic.getShape()) {
                                newGraphic.getShape().moveToFront();
                            }
                        }
                    } else {
                        this.mapInstance.graphics.add(g);
                    }
                }
            },

            /**
             * Set (change) the symbol of the given graphic.
             *
             * @method setSymbol
             * @param {Graphic} graphic - the graphic whose symbol is to be set.
             * @param {string} color - name of the color to use as a fill color.
             */
            setSymbol: function(graphic, color) {
                var symbol = this.getSymbol(graphic.geometry, color);
                graphic.setSymbol(symbol);
            },

            /**
             * Determine symbol for graphic based on supplied color and geometry type.
             *
             * @method getSymbol
             * @param {Geometry} geometry - the geometry to be symbolized.
             * @param {string} color - name of the color to use as a fill color.
             * @returns {Symbol}
             */
            getSymbol: function(geometry, color) {
                var symbol, dojoColor;
                color = (typeof color === "undefined") ? "cyan" : color;

                switch (color) {
                    case "cyan":
                        dojoColor = new Color([0, 255, 255, 0.50]);
                        break;
                    case "yellow":
                        dojoColor = new Color([255, 255, 0, 0.50]);
                        break;
                    case "red":
                        dojoColor = new Color([255, 0, 0, 0.25]);
                        break;
                    case "green":
                        dojoColor = new Color([0, 255, 0, 0.25]);
                        break;
                    case "blue":
                        dojoColor = new Color([0, 0, 255, 0.25]);
                        break;
                    case "grey":
                        dojoColor = new Color([117, 117, 117, 0.50]);
                        break;

                }

                switch (geometry.type) {
                    case "point":
                        symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), dojoColor);
                        break;
                    case "polyline":
                        symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2);
                        break;
                    case "polygon":
                        symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 3), dojoColor);
                        break;
                    case "extent":
                        symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([50, 50, 50]), 2), dojoColor);
                        break;
                    case "multipoint":
                        symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), dojoColor);
                        break;
                }
                return symbol;
            },

            /**
             * Remove graphic from map graphics layer
             *
             * @method removeGraphic
             */
            removeGraphic: function(graphic, map) {
                if (map === undefined) {
                    if (this.mapInstance !== null) {
                        if (this.mapInstance.graphics !== null && graphic !== null) {
                            this.mapInstance.graphics.remove(graphic);
                        }
                    }
                } else {
                    if (map !== null) {
                        if (map.graphics !== null && graphic !== null) {
                            map.graphics.remove(graphic);
                        }
                    }
                }
            },

            /**
             * Clear all graphics from map graphics layer
             *
             * @method clearGraphics
             */
            clearGraphics: function() {
                if (this.mapInstances !== null) {
                    for (var i = 0; i < this.mapInstances.length; i += 1) {
                        if (this.mapInstances[i].graphics !== null) {
                            this.mapInstances[i].graphics.clear();
                        }
                    }
                }
            },

            /**
            TODO: UPDATE COMMENTS
            Description

            @method Name
            @param {string} name - description.
            **/
            GetMapInitDataByID: function(mapID) {
                for (var i = 0; i < this.initializationData.maps.length; i++) {
                    if (this.initializationData.maps[i].mapID === mapID) {
                        return this.initializationData.maps[i];
                    }
                }
                return undefined;
            }


        };
        // End prototype

        /**
         * Get the singleton instance of the map.
         *
         * @method getInstance
         * @returns {Map}
         */
        MapModel.getInstance = function() {
            // summary:
            //      Gets an instance of the singleton
            if (instance === null) {
                instance = new MapModel();
            }
            return instance;
        };

        return MapModel.getInstance();
    });
}());
