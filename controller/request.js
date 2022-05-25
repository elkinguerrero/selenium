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
                console.log( actions[i] )
                if( await f_query( actions[i].vars, actions[i].action, actions[i].time, (i+1)) == 0 ){
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
    
    function f_query( vars, action, time, cont_action ) {
        time = !isNaN(!time) && time != "" && time != undefined ? parseInt(time) : 0 ;
        return new Promise(resolve => {
                if( vars != undefined && (vars.class == 'alert_confirm' || vars.class == 'alert_deny') ){
                    time = time<2000 ? 2000 : time ;
                    s_clase.push(vars.class);
                    arr_query.push(
                        async function () {
                            await timeout(time);

                            details = "";
                            if( !end_process ){                                
                                driver.switchTo().alert().then(async function(e) {
                                    details = await e.getText();
                                    if( vars.class == 'alert_confirm' )
                                        driver.switchTo().alert().accept();
                                    else if( vars.class == 'alert_deny' )
                                        driver.switchTo().alert().dismiss();

                                        driver.switchTo().alert().dismiss();
                                    
                                    if( !end_process ){
                                        end_process = true;

                                        result_final.push({
                                            "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                            "id_test_unique": codigo_unico,
                                            "id_test":id_test,
                                            "action": `${btoa( `{ "vars": ${JSON.stringify(vars)}, "action":${action}, "time":${time} },`)}`,
                                            "response": "ok",
                                            "details": details,
                                            "image": "",
                                            "registration_date": req.body.fecha,
                                            "status": "1",
                                            "id_num_test":cont_action,
                                        });
                                        s_clase[s_clase.indexOf(vars.class)] = undefined;
                                        resolve(1);
                                        
                                    }
                                }, async function (err) {
                                    if( !end_process )
                                        console.log( `---------------------------\nNo se encontro el elemento ${vars.class} se intentara buscarlo de nuevo` )
                                });
        
                                if( intent_petition > 9 ){
                                    console.log( `---------------------------\nclass or id ${vars.class} not found` )
                                    end_process = true;
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
                                        "id_num_test":cont_action,
                                    });
                                    resolve(0);
                                }else if( s_clase.indexOf(vars.class) != -1 ){
                                    intent_petition++;
                                    arr_query[s_clase.indexOf(vars.class)]()
                                }
                            }else{
                                resolve(1);
                            }
                        }
                    )
                
                    async function run(){
                        //Se pausa la aplicacion por un tiempo mientras por tiempo definido por el usuario
                        arr_query[s_clase.indexOf(vars.class)]()
                    }
                    run()
                }else if( action != 'p' ){
                    s_clase.push(vars.class);
                    arr_query.push(
                        async function () {
                            if( !end_process ){
                                //Se hace uso de la funcion wait para comprobar que el elemento realmente existe
                                await driver.wait(until.elementLocated(By.css(vars.class)),3000).then(async function (webElement) {
                                    //Se busca el elemento esto es necesario por si la pagina cambia y el elemento no existe
                                    await driver.findElement(object_class(vars.class)).then(async function (webElement) {
                                        end_process = true;
                                        details = "";
                                        if( action == "c" )
                                            await driver.findElement(object_class(vars.class)).click()
                                        else if( action == "gt" )
                                            details = await driver.findElement(object_class(vars.class)).getText();
                                        else if( action == "gv" )
                                            details = await driver.findElement(object_class(vars.class)).getAttribute("value");
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
                                                "details": details,
                                                "image": btoa(base64Data),
                                                "registration_date": req.body.fecha,
                                                "status": "1",
                                                "id_num_test":cont_action,
                                            });
                                            resolve(1);
                                        });
                                        s_clase[s_clase.indexOf(vars.class)] = undefined;
                                    }, function (err) {
                                        if( err.name == "NoSuchElementError" ){
                                            console.log( `---------------------------\nNo se encontro el elemento ${vars.class} se intentara buscarlo de nuevo` )
                                        }else{
                                            console.log(`---------------------------\n${err.name}`)
                                        }
                                    });
                                }, function (err) {
                                    console.log( `---------------------------\nNo se encontro el elemento ${vars.class} se intentara buscarlo de nuevo` )
                                });
        
                                if( intent_petition > 10 ){
                                    console.log( `---------------------------\nclass or id ${vars.class} not found` )
                                    end_process = true;
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
                                        "id_num_test":cont_action,
                                    });
                                    resolve(0);
                                }else if( s_clase.indexOf(vars.class) != -1 ){
                                    intent_petition++;
                                    arr_query[s_clase.indexOf(vars.class)]()
                                }
                            }else{
                                resolve(1);
                            }
                        }
                    )
                
                    async function run(){
                        //Se pausa la aplicacion por un tiempo mientras por tiempo definido por el usuario
                        await timeout(time);
                        arr_query[s_clase.indexOf(vars.class)]()
                    }
                    run()
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
                                "id_num_test":cont_action
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

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;