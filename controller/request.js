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

    async function f_test(actions){
        arr_query = [];
        s_clase = [];

        //Se agranda la pantalla
        await driver.manage().window().maximize();

        driver.get(req.body.url).then(async function () {
            for( var i=0; i<actions.length; i++ ){
                intent_petition = 0;
                end_process = false;
                console.log( actions[i] )
                if( await f_query( actions[i]) == 0 ){
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
    
    function f_query( actions ) {
        actions.time = !isNaN(!actions.time) && actions.time != "" && actions.time != undefined ? parseInt(actions.time) : 0 ;
        return new Promise(resolve => {
            if( actions.vars != undefined && (actions.vars.class == 'alert_confirm' || actions.vars.class == 'alert_deny') ){
                actions.time = actions.time<2000 ? 2000 : actions.time ;
                s_clase.push(actions.vars.class);
                arr_query.push(
                    async function () {
                        await timeout(actions.time);

                        details = "";
                        if( !end_process ){                                
                            driver.switchTo().alert().then(async function(e) {
                                details = await e.getText();
                                if( actions.vars.class == 'alert_confirm' )
                                    driver.switchTo().alert().accept();
                                else if( actions.vars.class == 'alert_deny' )
                                    driver.switchTo().alert().dismiss();

                                if( !end_process ){
                                    end_process = true;

                                    result_final.push({
                                        "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                        "id_test_unique": codigo_unico,
                                        "id_test":id_test,
                                        "action": `${btoa( JSON.stringify(actions) )}`,
                                        "response": "ok",
                                        "details": details,
                                        "image": "",
                                        "registration_date": req.body.fecha,
                                        "status": "1",
                                    });
                                    s_clase[s_clase.indexOf(actions.vars.class)] = undefined;
                                    resolve(1);
                                }
                            }, async function (err) {
                                if( !end_process ){
                                    if( intent_petition > 9 ){
                                        console.log( `---------------------------\nclass or id ${actions.vars.class} not found` )
                                        end_process = true;
                                        result_final.push({
                                            "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                            "id_test_unique": codigo_unico,
                                            "id_test":id_test,
                                            "action": `${btoa( JSON.stringify(actions) )}`,
                                            "response": `Failed`,
                                            "details": `class or id ${actions.vars.class} not found`,
                                            "image": "",
                                            "registration_date": req.body.fecha,
                                            "status": "1",
                                        });
                                        resolve(0);
                                    }else if( s_clase.indexOf(actions.vars.class) != -1 ){
                                        console.log( `---------------------------\nNo se encontro el elemento ${actions.vars.class} se intentara buscarlo de nuevo` )
                                        intent_petition++;
                                        arr_query[s_clase.indexOf(actions.vars.class)]()
                                    }
                                }
                            });
                        }else{
                            resolve(0);
                        }
                    }
                )
            
                async function run(){
                    //Se pausa la aplicacion por un tiempo mientras por tiempo definido por el usuario
                    arr_query[s_clase.indexOf(actions.vars.class)]()
                }
                run()
            }else if( actions.action != 'p' ){
                s_clase.push(actions.vars.class);
                arr_query.push(
                    async function () {
                        if( !end_process ){
                            //Se hace uso de la funcion wait para comprobar que el elemento realmente existe
                            await driver.wait(until.elementLocated(By.css(actions.vars.class)),3000).then(async function (webElement) {
                                //Se busca el elemento esto es necesario por si la pagina cambia y el elemento no existe
                                await driver.findElement(object_class(actions.vars.class)).then(async function (element) {
                                    end_process = true;
                                    details = "";
                                    let base64Data = '';

                                    if( actions.action == "c" ){
                                        takephoto()
                                        await driver.executeScript("arguments[0].scrollIntoView()", driver.findElement(object_class(actions.vars.class)));
                                        await driver.sleep(1000);
                                        await driver.findElement(object_class(actions.vars.class)).click()
                                    } else if( actions.action == "gt" ){
                                        takephoto()
                                        details = await driver.findElement(object_class(actions.vars.class)).getText();
                                    } else if( actions.action == "gv" ){
                                        takephoto()
                                        details = await driver.findElement(object_class(actions.vars.class)).getAttribute("value");
                                    } else if( actions.action == "w" ){
                                        await timeout(100);
                                        console.log(1)
                                        await driver.findElement(object_class(actions.vars.class)).clear();
                                        console.log(2)
                                        await driver.findElement(object_class(actions.vars.class)).sendKeys(actions.vars.text);
                                        console.log(3)
                                        takephoto()
                                        await timeout(1000);
                                    }else if( actions.action == "f" ){
                                        takephoto()
                                        details = await driver.findElement(object_class(actions.vars.class)).getAttribute(actions.attribute);
                                        details = `Coincidencias encontradas: ${details.split(actions.find).length-1}`;
                                    }

                                    result_final.push({
                                        "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                        "id_test_unique": codigo_unico,
                                        "id_test":id_test,
                                        "action": `${btoa( JSON.stringify(actions) )}`,
                                        "response": "ok",
                                        "details": details,
                                        "image": btoa(base64Data),
                                        "registration_date": req.body.fecha,
                                        "status": "1",
                                    });
                                    
                                    s_clase[s_clase.indexOf(actions.vars.class)] = undefined;
                                    resolve(1);
                                    async function takephoto(){
                                        //Se toma captura de panalla
                                        await driver.takeScreenshot().then(function(data){
                                            base64Data = data.replace(/^data:image\/png;base64,/,"")
                                        }, function (err) {
                                            console.log( `---------------------------\nNo se tomara captura de pantalla en elemento ${actions.vars.class}` )
                                        });
                                    }
                                }, function (err) {
                                    if( err.name == "NoSuchElementError" ){
                                        console.log( `---------------------------\nNo se encontro el elemento ${actions.vars.class} se intentara buscarlo de nuevo` )
                                    }else{
                                        console.log(`---------------------------\n${err.name}`)
                                    }
                                });
                            }, function (err) {
                                console.log( `---------------------------\nNo se encontro el elemento ${actions.vars.class} se intentara buscarlo de nuevo` )

                                if( intent_petition > 10 ){
                                    console.log( `---------------------------\nclass or id ${actions.vars.class} not found` )
                                    end_process = true;
                                    result_final.push({
                                        "id": Math.random().toString(30).slice(-15).replace(/[.]/g,"_"),
                                        "id_test_unique": codigo_unico,
                                        "id_test":id_test,
                                        "action": `${btoa( JSON.stringify(actions) )}`,
                                        "response": `Failed`,
                                        "details": `class or id ${actions.vars.class} not found`,
                                        "image": "",
                                        "registration_date": req.body.fecha,
                                        "status": "1",
                                    });
                                    resolve(0);
                                }else if( s_clase.indexOf(actions.vars.class) != -1 ){
                                    intent_petition++;
                                    arr_query[s_clase.indexOf(actions.vars.class)]()
                                }
                            });
                        }else{
                            resolve(0);
                        }
                    }
                )
            
                async function run(){
                    //Se pausa la aplicacion por un tiempo mientras por tiempo definido por el usuario
                    await timeout(actions.time);
                    arr_query[s_clase.indexOf(actions.vars.class)]()
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
                            "action": `${btoa( JSON.stringify(actions) )}`,
                            "response": "ok",
                            "details": "",
                            "image": btoa(base64Data),
                            "registration_date": req.body.fecha,
                            "status": "1",
                        });
                        resolve(1);
                    });
                }, actions.time);

                // setTimeout(async function(){
                //     //Se hace uso de la funcion wait para comprobar que el elemento realmente existe
                //     await driver.wait(until.elementLocated(By.css("#glcanvas")),3000).then(async function (webElement) {
                //         //Se busca el elemento esto es necesario por si la pagina cambia y el elemento no existe
                //         await driver.findElement(object_class("#glcanvas")).then(async function (webElement) {
                //             console.log( "-------" )
                //             // console.log( 1 
                //             var element = driver.findElement(object_class("#glcanvas"));

                //             const actions = driver.actions({async: true});
                //             // Performs mouse move action onto the element
                //             await actions.move({x:10,y:10}).pause(3000).perform();
                //             // actions.move_to_element_with_offset(driver.find_element_by_tag_name('body'), 0,0))

                //             // driver.swipe(540, 905, 540, 905, 50);
                //         });
                //     }, function (err) {
                //         console.log( `---------------------------\nNo se encontro el elemento ${actions.vars.class} se intentara buscarlo de nuevo` )
                //     });
                // }, 10000);
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