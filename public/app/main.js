/**
 * Call the application bootstrapper when ready.
 * Load in view models and bind them to their views via Kendo binding.
 *
 * @module main
 */

define([
        "app/models/map-model",
        "app/vm/mapContainer-vm",
        "app/vm/panel-vm",
        "app/vm/help-vm",
        "app/vm/markupTools-vm",
        "app/vm/markupToolsLaunchbar-vm",
        "app/vm/helpLaunchbar-vm",
        "app/vm/printLaunchbar-vm",
        "app/vm/print-vm",
        "app/vm/demographic-vm",
        "app/vm/cbr-vm",
        "app/vm/cbrlaunchbar-vm",
        "app/vm/panelLaunchbar-vm",
        "app/vm/interactiveTools-vm",
        "app/vm/legendLaunchbar-vm",
        "app/vm/legend-vm",
        "app/vm/socialLaunchbar-vm",
        "app/vm/social-vm",
        "app/vm/alert1-vm",
        "app/vm/alert2-vm",
        "app/vm/legal-vm",
        "app/vm/search-vm",
        "app/vm/subscribe-vm"
    ],

    function(
        mapModel,
        mapContainerVM,
        panelVM,
        helpVM,
        markupToolsVM,
        markupToolsBarVM,
        helpLaunchVM,
        printLaunchVM,
        printVM,
        demographicVM,
        cbrVM,
        cbrlBarVM,
        panelBarVM,
        interactiveToolsVM,
        legendBarVM,
        legendVM,
        socialLaunchVM,
        socialVM,
        alert1VM,
        alert2VM,
        legalVM,
        searchVM,
        subscribeVM
    ) {
        mapModel.initialize();

        mapContainerVM.init();

        panelVM.init();
        kendo.bind($("#reportLauncher"), panelVM);

        helpVM.init();
        kendo.bind($("#helpWindow"), helpVM);

        subscribeVM.init();
        kendo.bind($("#subscribeWindow"), subscribeVM);

        demographicVM.init();
        kendo.bind($("#demographicView"), demographicVM);

        legendVM.init();
        kendo.bind($("#legendDiv"), legendVM);

        markupToolsVM.init("display", "after");

        printVM.init();
        kendo.bind($("#printWindow"), printVM);

        socialVM.init();
        kendo.bind($("#shareWindowDiv"), socialVM);

        alert1VM.init();
        kendo.bind($("#alert1Window"), alert1VM);

        alert2VM.init();
        kendo.bind($("#alert2Window"), alert2VM);

        legalVM.init();
        kendo.bind($("legalWindow"), legalVM);

        cbrVM.init("display", "after");

        searchVM.init("titlebar", "after");
        kendo.bind($("#searchView"), searchVM);

        cbrlBarVM.init("titlebar", "after");
        kendo.bind($("#cbrlaunchbar"), cbrlBarVM);

        legendBarVM.init("titlebar", "after");
        kendo.bind($("#leglaunchbar"), legendBarVM);

        panelBarVM.init("titlebar", "after");
        kendo.bind($("#rplaunchbar"), panelBarVM);

        markupToolsBarVM.init("titlebar", "after");
        kendo.bind($("#mtlaunchbar"), markupToolsBarVM);

        printLaunchVM.init("titlebar", "after");
        kendo.bind($("#printlaunchbar"), printLaunchVM);

        socialLaunchVM.init("titlebar", "after");
        kendo.bind($("#sharelaunchbar"), socialLaunchVM);

        helpLaunchVM.init("titlebar", "after");
        kendo.bind($("#helplaunchbar"), helpLaunchVM);

        interactiveToolsVM.init();
        kendo.bind($("#pnlInteractiveDiv"), interactiveToolsVM);

    }
);
