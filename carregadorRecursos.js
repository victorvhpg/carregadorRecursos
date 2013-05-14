//@victorvhpg
//https://github.com/victorvhpg/carregadorRecursos
var carregadorRecursos = (function(w) {
    "use strict";
    var document = w.document, console = w.console;
    var _todosRecursos = {};
    return {
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
            var temp = src.split("?");
            temp = temp[0].split(".");
            var extensao = ((temp.length > 1) ? temp[temp.length - 1] : "");
            if (extensao === "") {

                extensao = this.getExtensaoQueSuporta();
                src = temp[0] + "." + extensao;
            }
            if (!this.formatoAudioSuportado[extensao]) {
                console.error("ERRO ao CARREGAR recurso : " + src + " # nao suporta audio " + extensao);
                callback(audio, false);
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
            }, false);
            audio.addEventListener("error", function(e) {
                console.dir(e);
                console.error("ERRO(" + e + ") ao CARREGAR recurso : " + src);
                callback(audio, false);
            }, false);
            audio.src = src;
            document.body.appendChild(audio);
            audio.load();
        },
        carregarImagem: function(src, callback) {
            var img = new Image();
            img.src = src;
            img.addEventListener("load", function() {
                callback(img, true);
            }, false);
            img.addEventListener("error", function() {
                console.error("ERRO ao CARREGAR recurso : " + src);
                callback(img, false);
            }, false);
            return img;
        },
        carregarJSON: function(src, callback) {
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType && xhr.overrideMimeType('application/json');
            xhr.open("GET", src, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    //200 - OK  , 0 - quando usa protocolo file://  ou eh outro dominio (CORS)                 
                    if ((xhr.status === 200 || xhr.status === 0) &&
                            xhr.responseText) {
                        //console.log( xhr.status);
                        callback(JSON.parse(xhr.responseText), true);
                    } else {
                        console.error("ERRO ao CARREGAR recurso : " + src);
                        callback({}, false);
                    }
                }
            };
            try {
                xhr.send(null);

            } catch (err) {
                var msg = (err && err.message) || "";
                console.error("ERRO(" + (msg) + ") ao CARREGAR recurso : " + src);
                console.warn("DICA: se tiver  no chrome e protocolo file:// ou CORS rode com  --allow-file-access-from-files --disable-web-security ");
            }
        },
        carregar: function(configRecursos, configCallbacks) {
            var tempoInicial = Date.now();
            var vetAudio = configRecursos.audio || [];
            var vetImg = configRecursos.imagens || [];
            var vetJSON = configRecursos.json || [];
            var totalParaCarregar = (vetAudio.length + vetImg.length + vetJSON.length);
            var totalJaCarregado = 0;
            var contErros = 0;
            var that = this;
            var carregaVetRecursos = function(vet, funcCarrega) {
                for (var i = 0, l = vet.length; i < l; i++) {
                    var src = vet[ i ];
                    if (configRecursos.forcarCarregamento) {
                        //forca um novo cache 
                        var semCache = "semCache=" + ((Date.now() + Math.random()) + "_" + i);
                        src += ((src.indexOf("?") !== -1) ? ("&" + semCache) : "?" + semCache);
                    }
                    funcCarrega.apply(that, [src, function(indice) {
                            return function(recurso, carregouComSucesso) {
                                totalJaCarregado++;
                                _todosRecursos[vet[ indice ]] = recurso;
                                var perc = ((totalJaCarregado * 100) / totalParaCarregar).toFixed(2);
                                !carregouComSucesso && contErros++;
                                configCallbacks.onAoCarregarUmRecurso(perc, vet[ indice ], carregouComSucesso);
                                if (totalJaCarregado === totalParaCarregar) {
                                    configCallbacks.onCarregouTodos(Date.now() - tempoInicial, (contErros === 0));
                                }
                            };
                        }(i)]);
                }
            };
            carregaVetRecursos(vetJSON, this.carregarJSON);
            carregaVetRecursos(vetImg, this.carregarImagem);
            carregaVetRecursos(vetAudio, this.carregarAudio);
        },
        get: function(src) {
            return (src in _todosRecursos && _todosRecursos[src]) || (function() {
                throw new Error("recurso nao encontrado : " + src);
            }());
        }
    };
}(window));