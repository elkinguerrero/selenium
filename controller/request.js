const express = require('express');
const router = express.Router();
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
var btoa = require('btoa');
var atob = require('atob');

router.post('/test', async (req, res) => {
    var codigo_unico = Math.random().toString(30).slice(-15).replace(/[.]/g,"_");
    var id_test = req.body.id_1;
    var result_final = [];
    var intent_petition, end_process;

    const service = new chrome.ServiceBuilder('chromedriver/chromedriver');
    const driver = new Builder().forBrowser('chrome').setChromeService(service).build();

    const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

    var arr_query = [];
    var s_clase = [];

    f_test(JSON.parse(atob(req.body.json_test)));

    function f_test(actions){
        arr_query = [];
        s_clase = [];
    
        driver.get(req.body.url).then(async function () {
            for( var i=0; i<actions.length; i++ ){
                intent_petition = 0;
                end_process = false;
                console.log( 
                    actions[i] )
                if( await f_query( actions[i].vars, actions[i].action, actions[i].time ) == 0 ){
                    i=actions.length;
                }
            }
    
            console.log(`Fin de ejecución de query ${id_test}`)
            setTimeout( function(){ 
                // cierre de pruebas
                console.log(`Cierre del proceso ${id_test}`)
                res.json(result_final)
                driver.quit()
            } , 5000);
        });
    }
    
    function f_query( vars, action, time ) {
        time = !isNaN(!time) && time != "" && time != undefined ? parseInt(time) : 3000 ;
        return new Promise(resolve => {
            
                if( vars != undefined && vars.class == 'alert_confirm' ){
                    setTimeout(function(){
                        driver.switchTo().alert().accept();
                        resolve(1);
                    }, time);
                }else if( action != 'p' ){
                    arr_query.push(
                        setInterval(async function () {
                            if( !end_process ){
                                await driver.findElement(object_class(vars.class)).then(async function (webElement) {
                                    //Se hace uso de la funcion wait para comprobar que el elemento realmente existe
                                    await driver.wait(until.elementLocated(By.css(vars.class)),30000);

                                    end_process = true;
                                    if( action == "c" )
                                        await driver.findElement(object_class(vars.class)).click()
                                    else if( action == "w" ){
                                        await driver.findElement(object_class(vars.class)).clear();
                                        await driver.findElement(object_class(vars.class)).sendKeys(vars.text);
                                    }
            
                                    await driver.takeScreenshot().then(function(data){
                                        var base64Data = data.replace(/^data:image\/png;base64,/,"")
                                        result_final.push({
                                            "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                            "id_test_unique": codigo_unico,
                                            "id_test":id_test,
                                            "action": `${btoa( `{ "vars": ${JSON.stringify(vars)}, "action":${action}, "time":${time} },`)}`,
                                            "response": "ok",
                                            "details": "",
                                            "image": btoa(base64Data),
                                            "registration_date": req.body.fecha,
                                            "status": "1",
                                        });
                                        resolve(1);
                                    });
                                                            
                                    clearInterval(arr_query[s_clase.indexOf(vars.class)]);
                                    s_clase[s_clase.indexOf(vars.class)] = undefined;
                                }, function (err) {
                                    if( err.name == "NoSuchElementError" )
                                        console.log( `---------------------------\nNo se encontro el elemento ${vars.class} se intentara buscarlo de nuevo` )
                                    else
                                        console.log(`---------------------------\n${err.name}`)
                                });
        
                                if( intent_petition > 10 ){
                                    console.log( `---------------------------\nclass or id ${vars.class} not found` )
                                    end_process = true;
                                    clearInterval(arr_query[s_clase.indexOf(vars.class)]);
                                    result_final.push({
                                        "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                        "id_test_unique": codigo_unico,
                                        "id_test":id_test,
                                        "action": `${btoa( `{ "vars": ${JSON.stringify(vars)}, "action":${action}, "time":${time} },`)}`,
                                        "response": `Failed`,
                                        "details": `class or id ${vars.class} not found`,
                                        "image": "",
                                        "registration_date": req.body.fecha,
                                        "status": "1",
                                    });
                                    resolve(0);
                                }
                                intent_petition++;
                            }else{
                                resolve(1);
                            }
                        }, time)
                    )
                
                    s_clase.push(vars.class);
                }else{
                    setTimeout(function(){
                        driver.takeScreenshot().then(function(data){
                            var base64Data = data.replace(/^data:image\/png;base64,/,"")
                            result_final.push({
                                "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                "id_test_unique": codigo_unico,
                                "id_test":id_test,
                                "action": `${btoa( `{ "vars": "", "action":${action}, "time":${time} },`)}`,
                                "response": "ok",
                                "details": "",
                                "image": btoa(base64Data),
                                "registration_date": req.body.fecha,
                                "status": "1",
                            });
                            resolve(1);
                        });
                    }, time);
                }
        });
    }
    
    function object_class(clase) {
        var object_general_class = webdriver.By.className('class')
        object_general_class.value = clase;
    
        return object_general_class;
    }
});

module.exports = router;