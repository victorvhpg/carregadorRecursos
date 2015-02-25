//@victorvhpg
//https://github.com/victorvhpg/carregadorRecursos
(function(w) {
    "use strict";
    var document = w.document,
        console = w.console;
    var _erros = [];
    var _todosRecursos = {};
    var carregadorRecursos = {
        formatoAudioSuportado: (function() {
            var suporta = {};
            var audio = document.createElement("audio");
            var formatos = {
                ogg: "audio/ogg; codecs=\"vorbis\"",
                wav: "audio/wav; codecs=\"1\"",
                webma: "audio/webm; codecs=\"vorbis\"",
                mp3: "audio/mpeg; codecs=\"mp3\"",
                m4a: "audio/mp4; codecs=\"mp4a.40.2\""
            };
            for (var i in formatos) {
                var pode = audio.canPlayType(formatos[i]);
                suporta[i] = (pode !== "" && pode !== "no");
            }
            return suporta;
        }()),

        getExtensaoQueSuporta: function() {
            for (var f in this.formatoAudioSuportado) {
                if (this.formatoAudioSuportado[f]) {
                    return f;
                }
            }
            return "";
        },

        carregarAudio: function(src, callback) {
            var that = this;
            return new Promise(function(resolve, reject) {
                var temp = src.split("?");
                temp = temp[0].split(".");
                var extensao = ((temp.length > 1) ? temp[temp.length - 1] : "");
                if (extensao === "") {
                    //se enviar src sem  extensao  entao assume a q suporta
                    extensao = that.getExtensaoQueSuporta();
                    src = temp[0] + "." + extensao;
                }
                if (!that.formatoAudioSuportado[extensao]) {
                    console.error("ERRO ao CARREGAR recurso : " + src + " # nao suporta audio " + extensao);
                    callback(audio, false);
                    reject(new Error("ERRO ao CARREGAR recurso : " + src + " # nao suporta audio " + extensao));
                    return;
                }

                var ok = false;
                var audio = document.createElement("audio");
                audio.preload = "auto";
                audio.addEventListener("canplaythrough", function() {
                    //     console.log("audio" , src);
                    //no ff quando usa protocolo file:// estava chamando 2 vezes o canplaythrough
                    if (ok) {
                        return;
                    }
                    ok = true;
                    callback(audio, true);
                    resolve(audio);
                }, false);
                audio.addEventListener("error", function(e) {
                    console.dir(e);
                    console.error("ERRO(" + e + ") ao CARREGAR recurso : " + src);
                    callback(audio, false);
                    reject(new Error("ERRO(" + e + ") ao CARREGAR recurso : " + src));
                }, false);
                audio.src = src;
                document.body.appendChild(audio);
                audio.load();
            });
        },

        carregarImagem: function(src, callback) {
            return new Promise(function(resolve, reject) {
                var img = new Image();
                img.src = src;
                if (img.complete) {
                    callback(img, true);
                    resolve(img);
                    return;
                }
                img.addEventListener("load", function() {
                    callback(img, true);
                    resolve(img);
                }, false);
                img.addEventListener("error", function() {
                    console.error("ERRO ao CARREGAR recurso : " + src);
                    callback(img, false);
                    reject(new Error(img));
                }, false);
            });
        },

        carregarJSON: function(src, callback) {
            return new Promise(function(reolve, reject) {
                var xhr = new XMLHttpRequest();
                void(xhr.overrideMimeType && xhr.overrideMimeType("application/json"));
                xhr.open("GET", src, true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        //200 - OK  , 0 - quando usa protocolo file://  ou eh outro dominio (CORS)
                        if ((xhr.status === 200 || xhr.status === 0) &&
                            xhr.responseText) {
                            //console.log( xhr.status);
                            var json = JSON.parse(xhr.responseText);
                            callback(json, true);
                            reolve(json);
                        } else {
                            console.error("ERRO ao CARREGAR recurso : " + src);
                            callback({}, false);
                            reject(new Error("ERRO ao CARREGAR recurso : " + src));
                        }
                    }
                };
                try {
                    xhr.send(null);

                } catch (err) {
                    var msg = (err && err.message) || "";
                    console.error("ERRO(" + (msg) + ") ao CARREGAR recurso : " + src);
                    console.warn("DICA: se tiver  no chrome e protocolo file:// ou CORS rode com  --allow-file-access-from-files --disable-web-security ");
                    reject(new Error("ERRO(" + (msg) + ") ao CARREGAR recurso : " + src));
                }
            });
        },

        carregar: function(configRecursos, configCallbacks) {
            var tempoInicial = Date.now();
            var vetAudio = configRecursos.audio || [];
            var vetImg = configRecursos.imagens || [];
            var vetJSON = configRecursos.json || [];
            var totalParaCarregar = (vetAudio.length + vetImg.length + vetJSON.length);
            var totalJaCarregado = 0;
            var that = this;
            _erros = [];
            return new Promise(function(resolve, reject) {
                var carregaVetRecursos = function(vet, funcCarrega) {
                    for (var i = 0, l = vet.length; i < l; i++) {
                        var src = vet[i];
                        if (configRecursos.forcarCarregamento) {
                            //forca um novo cache
                            var semCache = "semCache=" + ((Date.now() + Math.random()) + "_" + i);
                            src += ((src.indexOf("?") !== -1) ? ("&" + semCache) : "?" + semCache);
                        }
                        funcCarrega.apply(that, [src,
                            function(indice) {
                                return function(recurso, carregouComSucesso) {
                                    totalJaCarregado++;
                                    _todosRecursos[vet[indice]] = recurso;
                                    var perc = ((totalJaCarregado * 100) / totalParaCarregar).toFixed(2);
                                    void(!carregouComSucesso && _erros.push(vet[indice]));
                                    configCallbacks.onAoCarregarUmRecurso(perc, vet[indice], carregouComSucesso);
                                    if (totalJaCarregado === totalParaCarregar) {
                                        var t = Date.now() - tempoInicial;
                                        var sucesso = _erros.length === 0;
                                        configCallbacks.onCarregouTodos(t, sucesso);
                                        void((!sucesso && reject(new Error("total de falhas: " + _erros.length))) ||
                                            resolve(t, sucesso));
                                    }
                                };
                            }(i)
                        ]);
                    }
                };
                carregaVetRecursos(vetJSON, that.carregarJSON);
                carregaVetRecursos(vetImg, that.carregarImagem);
                carregaVetRecursos(vetAudio, that.carregarAudio);
            });
        },

        getSrcsErros: function() {
            return _erros;
        },

        get: function(src) {
            return _todosRecursos[src] || (function() {
                throw new Error("recurso nao encontrado : " + src);
            }());
        }
    };

    if (typeof define === "function" && define.amd) {
        //AMD
        define(function() {
            return carregadorRecursos;
        });
    } else if (typeof exports === "object") {
        //CommonJS - browserify
        module.exports = carregadorRecursos;
    } else {
        //global 
        w.carregadorRecursos = carregadorRecursos;
    }

}(window));