define([
    'postmonger'
], function (
    Postmonger
) {
    'use strict';

    var connection = new Postmonger.Session();
    var payload = {};
    var eventDefinitionKey;
    var schema;
    var lastStepEnabled = false;
    var steps = [ // initialize to the same value as what's set in config.json for consistency
        { "label": "Create SMS Message", "key": "step1" }
    ];
    var currentStep = steps[0].key;

    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);

    connection.on('clickedNext', save);
    //connection.on('clickedBack', onClickedBack);
    //connection.on('gotoStep', onGotoStep);

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('requestInteraction');
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
    }
    function initialize(data) {
        console.log("Initializing data data: " + JSON.stringify(data));
        if (data) {
            payload = data;
        }

        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        console.log('Has In arguments: ' + JSON.stringify(inArguments));

        $.each(inArguments, function (index, inArgument) {
            $.each(inArgument, function (key, val) {
                if (key === 'messageTemplate') {
                    $('#messageTemplate').val(val);
                }

                if (key === 'apiKey') {
                    $('#apiKey').val(val);
                }

                if (key === 'to') {
                    const match = key.match(/\."([^"]+)"\}\}$/);
                    console.log("Match: " + match);
                    $('#phoneColumn').data('selectedValue', match ? match[1] : null);
                }
            })
        });

        connection.trigger('updateButton', {
            button: 'next',
            text: 'done',
            visible: true
        });

    }

    function onGetTokens(tokens) {
        // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
        console.log("Tokens function: " + JSON.stringify(tokens));
        //authTokens = tokens;
    }

    function onGetEndpoints(endpoints) {
        // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
        console.log("Get End Points function: " + JSON.stringify(endpoints));
    }

    connection.on('requestedInteraction', function (settings) {
        eventDefinitionKey = settings.triggers[0].metaData.eventDefinitionKey;
        connection.trigger('requestSchema');
    });
    connection.on('requestedSchema', function (data) {
        schema = data.schema;
        console.log(schema);

        // Filtra as colunas do tipo Phone
        var phoneColumns = schema.filter(function (column) {
            return column.type === 'Phone';  // Filtra apenas as colunas do tipo Phone
        }).map(function (column) {
            return column.key.split('.').pop();  // Extrai a última parte da chave da coluna
        });

        // Filtra as colunas do tipo Text
        var textColumns = schema.filter(function (column) {
            return column.type === 'Text';  // Filtra apenas as colunas do tipo Text
        }).map(function (column) {
            return column.key.split('.').pop();  // Extrai a última parte da chave da coluna
        });

        // Limpa e preenche phoneColumn com colunas do tipo Phone
        $('#phoneColumn').empty();
        console.log("Selected Value: " + $('#phoneColumn').data('selectedValue'));
        $('#phoneColumn').append(new Option('-- Selecione aqui --', ''));
        phoneColumns.forEach(function (column) {
            console.log(column, $('#phoneColumn').data('selectedValue'), column == $('#phoneColumn').data('selectedValue'), column == $('#phoneColumn').data('selectedValue'), column == $('#phoneColumn').data('selectedValue'))
            $('#phoneColumn').append(new Option(column, column, column == $('#phoneColumn').data('selectedValue'), column == $('#phoneColumn').data('selectedValue')))
        });

        // Limpa e preenche var1Column com colunas do tipo Text
        $('#var1Column').empty();
        textColumns.forEach(function (column) {
            $('#var1Column').append(new Option(column, column)); // Adiciona as colunas do tipo Text
        });

        // Limpa e preenche var2Column com colunas do tipo Text
        $('#var2Column').empty();
        textColumns.forEach(function (column) {
            $('#var2Column').append(new Option(column, column)); // Adiciona as colunas do tipo Text
        });
    });

    function save() {
        var selectedPhoneColumn = $('#phoneColumn').val();
        var selectedVar1Column = $('#var1Column').val();
        var selectedVar2Column = $('#var2Column').val();
        var messageTemplate = $('#messageTemplate').val();
        var apiKey = $('#apiKey').val();
        var phone = '{{Event.' + eventDefinitionKey + '.' + '"' + selectedPhoneColumn + '"' + '}}';
        var var1 = '{{Event.' + eventDefinitionKey + '.' + '"' + selectedVar1Column + '"' + '}}';
        var var2 = '{{Event.' + eventDefinitionKey + '.' + '"' + selectedVar2Column + '"' + '}}';
        payload['arguments'].execute.inArguments = [{
            "messageTemplate": messageTemplate,
            "apiKey": apiKey,
            "email": "{{InteractionDefaults.Email}}",
            "to": phone,
            "var1": var1,
            "var2": var2
        }];

        payload['metaData'].isConfigured = true;

        console.log("Payload on SAVE function: " + JSON.stringify(payload));
        connection.trigger('updateActivity', payload);

    }

});
