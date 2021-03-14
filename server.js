'use strict';

const express = require('express');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

var homeId = process.env.HOME_ID;
var email = process.env.EMAIL;
var password = process.env.PASSWORD;

const Tado = require('node-tado-client');
const Numeral = require('numeral');
const app = express();

app.get('/', (req, res) => {
	var tado = new Tado();

	tado.login(email, password).then((token) => {
    	tado.getZones(homeId).then(zones => {
			var zoneResults = [];
			zones.forEach(zone => {
				zoneResults.push(tado.getZoneState(homeId, zone.id));
			});

			Promise.all(zoneResults).then(data => {
				var results = [];

				var idx=0;
				zones.forEach(z => {
					var name = z.name;
					var temp = Numeral(data[idx].sensorDataPoints.insideTemperature.celsius).format('0.0') + 'C';
					var humidity = Numeral(data[idx].sensorDataPoints.humidity.percentage).format('0') + '%';
					var state = data[idx].setting.power;

	    			if (data[idx].setting.temperature) {
	    				var target = Numeral(data[idx].setting.temperature.celsius).format('0.0') + 'C';	
	    			} else {
	    				var target = ''
	    			}
    			
		            var heatingPct = data[idx].activityDataPoints.heatingPower.percentage;
		            
		            if(heatingPct >= 1) {
		            	var heatingPctString = Numeral(heatingPct).format('0')+'%';
		            } else {
		                var heatingPctString = '';
		            }

		            var row = '<tr>';
		            row += '<td style="text-align: left;">' + name + '</td>';
		            row += '<td>' + temp + '</td>';
		            row += '<td>' + humidity + '</td>';
		            row += '<td>' + target + '</td>';
		            row += '<td>' + heatingPctString + '</td>';
		            row += '</tr>';

		           	results.push(row);
					idx++;
				});

				res.writeHead(200, {
			        'Content-Type': 'text/html; charset=utf-8'
			    });

				var rows = results.sort().join('');
				var headers = ['name', 'temperate', 'humidity', 'target', 'power'];
				var headerRow = '<tr><th>' + headers.join('</th><th>') + '</th></tr>';
				res.write('<style type="text/css">* { font-size: 34px; text-align: center;}</style>');
			    res.write('<table style="width: 100%; border: solid black 1px; border-collapse: collapse;" border="1" cellpadding="5" cellmargin="0">' + headerRow + rows + '</table>');
			    res.end();
			});   	
		});
	});
});

app.get('/stop', (req, res) => {
	var tado = new Tado();

	tado.login(email, password).then((token) => {
    	tado.getZones(homeId).then(zones => {
			var zoneResults = [];
			zones.forEach(zone => {
				zoneResults.push(
					tado.setZoneOverlay(homeId, zone.id, 'off', 22, 'manual')
				);
			});

			Promise.all(zoneResults).then(data => {
				res.send('OK');
			});   	
		});
	});
});

app.get('/start', (req, res) => {
	var tado = new Tado();

	tado.login(email, password).then((token) => {
    	tado.getZones(homeId).then(zones => {
			var zoneResults = [];
			zones.forEach(zone => {
				zoneResults.push(
					tado.clearZoneOverlay(homeId, zone.id)
				);
			});

			Promise.all(zoneResults).then(data => {
				res.send('OK');
			});   	
		});
	});
});

app.listen(PORT, HOST);
