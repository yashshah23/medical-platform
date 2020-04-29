/*global app*/
app.service('S', function($http) {
	return {
		"baseUrl": "../../../../../prestige/api",   // for local use
		//"baseUrl": "../../../../../prana/api", // for itatonce.in/test/prana
		"productName": "pRESTige",
		"supportEmail": "support@prestigeframework.com",
		"enableSaaS": true,
		"openRegistration": true,
		"legacyMode": false,
		"fieldTypes": [{
			"id": 1,
			"title": "Text",
			"type": "text"
		}, {
			"id": 2,
			"title": "Number",
			"type": "number"
		}, {
			"id": 3,
			"title": "Dropdown",
			"type": "list"
		}, {
			"id": 4,
			"title": "RadioButtonList",
			"type": "list"
		}, {
			"id": 5,
			"title": "CheckBoxList",
			"type": "list"
		}, {
			"id": 6,
			"title": "Date",
			"type": "date"
		}, {
			"id": 7,
			"title": "Time",
			"type": "time"
		}, {
			"id": 8,
			"title": "File",
			"type": "file"
		},{
			"id": 9,
			"title": "TextArea",
			"type": "textarea"
		}]
	}
});