"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = require("chalk");
var os_1 = require("os");
var path_1 = require("path");
var fs_1 = require("fs");
var baileys_1 = require("@whiskeysockets/baileys");
// Jimp y fluent-ffmpeg funcionan bien en Termux/Android
var jimp_1 = require("jimp");
var terminal_image_1 = require("terminal-image");
var fluent_ffmpeg_1 = require("fluent-ffmpeg");
var awesome_phonenumber_1 = require("awesome-phonenumber");
// Cache para stickers procesados (evitar reprocesar el mismo sticker)
var stickerCache = new Map();
var CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
function printMessage(m, context) {
    var _a, e_1, _b, _c, _d, e_2, _e, _f;
    var _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (context === void 0) { context = { conn: {} }; }
    return __awaiter(this, void 0, void 0, function () {
        var conn, getName, timeStr, senderJid, chatId, isGroup, senderNum, sender, phoneNumber, chatName, senderName, messageContent, messageTypes, messageKey, _r, messageType, messageText, mostrarImagen, mostrarStickerAnimado, stream, buf, _s, stream_1, stream_1_1, chunk, e_1_1, err_1, msgContent, isAnimated, stream, buf, _t, stream_2, stream_2_1, chunk, e_2_1, err_2, _i, _u, jid, cleanJid, name, user, messageId;
        var _this = this;
        return __generator(this, function (_v) {
            switch (_v.label) {
                case 0:
                    conn = context.conn;
                    getName = function (jid) { return __awaiter(_this, void 0, Promise, function () {
                        var metadata, _a, name, _b, _c;
                        var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
                        return __generator(this, function (_t) {
                            switch (_t.label) {
                                case 0:
                                    _t.trys.push([0, 9, , 10]);
                                    if (!jid)
                                        return [2 /*return*/, '(Desconocido)'];
                                    if (jid === ((_d = conn.user) === null || _d === void 0 ? void 0 : _d.id))
                                        return [2 /*return*/, ((_e = conn.user) === null || _e === void 0 ? void 0 : _e.name) || 'Yo'];
                                    if ((_j = (_h = (_g = (_f = global.db) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.users) === null || _h === void 0 ? void 0 : _h[jid]) === null || _j === void 0 ? void 0 : _j.name)
                                        return [2 /*return*/, global.db.data.users[jid].name];
                                    if ((_o = (_m = (_l = (_k = global.db) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l.chats) === null || _m === void 0 ? void 0 : _m[jid]) === null || _o === void 0 ? void 0 : _o.subject)
                                        return [2 /*return*/, global.db.data.chats[jid].subject];
                                    if ((_s = (_r = (_q = (_p = global.db) === null || _p === void 0 ? void 0 : _p.data) === null || _q === void 0 ? void 0 : _q.chats) === null || _r === void 0 ? void 0 : _r[jid]) === null || _s === void 0 ? void 0 : _s.name)
                                        return [2 /*return*/, global.db.data.chats[jid].name];
                                    if (!(conn.groupMetadata && jid.endsWith('@g.us'))) return [3 /*break*/, 4];
                                    _t.label = 1;
                                case 1:
                                    _t.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, conn.groupMetadata(jid)];
                                case 2:
                                    metadata = _t.sent();
                                    if (metadata === null || metadata === void 0 ? void 0 : metadata.subject)
                                        return [2 /*return*/, metadata.subject];
                                    return [3 /*break*/, 4];
                                case 3:
                                    _a = _t.sent();
                                    return [3 /*break*/, 4];
                                case 4:
                                    if (!(conn && typeof conn.getName === 'function')) return [3 /*break*/, 8];
                                    _t.label = 5;
                                case 5:
                                    _t.trys.push([5, 7, , 8]);
                                    return [4 /*yield*/, conn.getName(jid)];
                                case 6:
                                    name = _t.sent();
                                    if (name && name !== jid)
                                        return [2 /*return*/, name];
                                    return [3 /*break*/, 8];
                                case 7:
                                    _b = _t.sent();
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/, jid.split('@')[0]];
                                case 9:
                                    _c = _t.sent();
                                    return [2 /*return*/, jid.split('@')[0]];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); };
                    timeStr = new Date().toLocaleTimeString();
                    senderJid = (m.key.participant || m.key.remoteJid || '').replace(/:\d+/, '');
                    chatId = (m.key.remoteJid || '').replace(/:\d+/, '');
                    isGroup = chatId.endsWith('@g.us');
                    senderNum = senderJid.replace(/@.*/, '');
                    sender = senderNum;
                    try {
                        phoneNumber = (0, awesome_phonenumber_1.default)('+' + senderNum);
                        if (phoneNumber.isValid()) {
                            sender = phoneNumber.getNumber('international') || senderNum;
                        }
                    }
                    catch (_w) { }
                    return [4 /*yield*/, getName(chatId)];
                case 1:
                    chatName = _v.sent();
                    return [4 /*yield*/, getName(senderJid)];
                case 2:
                    senderName = _v.sent();
                    messageContent = m.message;
                    messageTypes = {
                        conversation: { type: 'TEXT', text: (messageContent === null || messageContent === void 0 ? void 0 : messageContent.conversation) || '' },
                        extendedTextMessage: { type: 'EXTENDED_TEXT', text: ((_g = messageContent === null || messageContent === void 0 ? void 0 : messageContent.extendedTextMessage) === null || _g === void 0 ? void 0 : _g.text) || '' },
                        imageMessage: { type: 'IMAGE', text: ((_h = messageContent === null || messageContent === void 0 ? void 0 : messageContent.imageMessage) === null || _h === void 0 ? void 0 : _h.caption) || '' },
                        stickerMessage: { type: 'STICKER', text: '[Sticker]' },
                        audioMessage: { type: 'AUDIO', text: '[Audio]' },
                        videoMessage: { type: 'VIDEO', text: ((_j = messageContent === null || messageContent === void 0 ? void 0 : messageContent.videoMessage) === null || _j === void 0 ? void 0 : _j.caption) || '[Video]' },
                        documentMessage: { type: 'DOCUMENT', text: ((_k = messageContent === null || messageContent === void 0 ? void 0 : messageContent.documentMessage) === null || _k === void 0 ? void 0 : _k.fileName) || '[Documento]' }
                    };
                    messageKey = Object.keys(messageTypes).find(function (key) { return messageContent === null || messageContent === void 0 ? void 0 : messageContent[key]; });
                    _r = messageKey ? messageTypes[messageKey] : { type: 'UNKNOWN', text: '' }, messageType = _r.type, messageText = _r.text;
                    if (Math.random() < 0.4) {
                        console.log(chalk_1.default.cyan("\uD83D\uDCAC Mensajes no le\u00EDdos: 1 | Chat: ".concat(chatName)));
                    }
                    console.log(chalk_1.default.cyanBright('┌─────────────────────────────'));
                    console.log(chalk_1.default.cyanBright("\u2502 \uD83D\uDCE4 De: ") + chalk_1.default.green(sender));
                    console.log(chalk_1.default.cyanBright("\u2502 \uD83E\uDDED Chat: ") + chalk_1.default.yellow(chatName));
                    console.log(chalk_1.default.cyanBright("\u2502 \uD83D\uDD52 Hora: ") + chalk_1.default.magenta(timeStr));
                    console.log(chalk_1.default.cyanBright("\u2502 \uD83D\uDDC2\uFE0F Tipo: ") + chalk_1.default.blueBright(messageType.toUpperCase()));
                    if (messageText)
                        console.log(chalk_1.default.cyanBright("\u2502 \uD83D\uDCAC Texto: ") + chalk_1.default.whiteBright(messageText.slice(0, 200)));
                    console.log(chalk_1.default.cyanBright('└─────────────────────────────'));
                    mostrarImagen = function (buf, isWebp, isAnimated) {
                        if (isWebp === void 0) { isWebp = false; }
                        if (isAnimated === void 0) { isAnimated = false; }
                        return __awaiter(_this, void 0, void 0, function () {
                            var input_1, output_1, _a, img, optimizedBuf, terminalImg, _b, _c;
                            var _this = this;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 13, , 14]);
                                        if (!isAnimated) return [3 /*break*/, 2];
                                        return [4 /*yield*/, mostrarStickerAnimado(buf)];
                                    case 1:
                                        _d.sent();
                                        return [2 /*return*/];
                                    case 2:
                                        if (!isWebp) return [3 /*break*/, 7];
                                        console.log(chalk_1.default.magenta('🎬 Procesando sticker estático con FFmpeg...'));
                                        input_1 = (0, path_1.join)((0, os_1.tmpdir)(), "static_".concat(Date.now(), ".webp"));
                                        output_1 = input_1.replace('.webp', '.png');
                                        _d.label = 3;
                                    case 3:
                                        _d.trys.push([3, 5, , 6]);
                                        (0, fs_1.writeFileSync)(input_1, buf);
                                        return [4 /*yield*/, new Promise(function (resolve) {
                                                (0, fluent_ffmpeg_1.default)(input_1)
                                                    .outputOptions([
                                                    '-vf', 'scale=40:30',
                                                    '-q:v', '31',
                                                    '-preset', 'ultrafast'
                                                ])
                                                    .save(output_1)
                                                    .on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                                                    var imgBuf, terminalImg, _a;
                                                    return __generator(this, function (_b) {
                                                        switch (_b.label) {
                                                            case 0:
                                                                _b.trys.push([0, 3, , 4]);
                                                                if (!(0, fs_1.existsSync)(output_1)) return [3 /*break*/, 2];
                                                                imgBuf = (0, fs_1.readFileSync)(output_1);
                                                                return [4 /*yield*/, terminal_image_1.default.buffer(imgBuf, {
                                                                        width: 20,
                                                                        height: 10,
                                                                        preserveAspectRatio: false
                                                                    })];
                                                            case 1:
                                                                terminalImg = _b.sent();
                                                                console.log(chalk_1.default.magenta('📱'), terminalImg);
                                                                (0, fs_1.unlinkSync)(output_1);
                                                                _b.label = 2;
                                                            case 2: return [3 /*break*/, 4];
                                                            case 3:
                                                                _a = _b.sent();
                                                                return [3 /*break*/, 4];
                                                            case 4:
                                                                resolve();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); })
                                                    .on('error', function () { return resolve(); });
                                            })];
                                    case 4:
                                        _d.sent();
                                        if ((0, fs_1.existsSync)(input_1))
                                            (0, fs_1.unlinkSync)(input_1);
                                        return [3 /*break*/, 6];
                                    case 5:
                                        _a = _d.sent();
                                        return [3 /*break*/, 6];
                                    case 6: return [3 /*break*/, 12];
                                    case 7:
                                        _d.trys.push([7, 11, , 12]);
                                        return [4 /*yield*/, jimp_1.default.read(buf)];
                                    case 8:
                                        img = _d.sent();
                                        return [4 /*yield*/, img.resize(64, 64).getBufferAsync(jimp_1.default.MIME_PNG)];
                                    case 9:
                                        optimizedBuf = _d.sent();
                                        return [4 /*yield*/, terminal_image_1.default.buffer(optimizedBuf, {
                                                width: 15,
                                                height: 8,
                                                preserveAspectRatio: false
                                            })];
                                    case 10:
                                        terminalImg = _d.sent();
                                        console.log(chalk_1.default.cyan('🖼️'), terminalImg);
                                        return [3 /*break*/, 12];
                                    case 11:
                                        _b = _d.sent();
                                        console.log(chalk_1.default.cyan('🖼️'));
                                        return [3 /*break*/, 12];
                                    case 12: return [3 /*break*/, 14];
                                    case 13:
                                        _c = _d.sent();
                                        console.log(chalk_1.default.cyan('🖼️ [Media]'));
                                        return [3 /*break*/, 14];
                                    case 14: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    mostrarStickerAnimado = function (buf) { return __awaiter(_this, void 0, void 0, function () {
                        var input, output, _a;
                        var _this = this;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    input = (0, path_1.join)((0, os_1.tmpdir)(), "anim_".concat(Date.now(), ".webp"));
                                    output = input.replace('.webp', '.png');
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 3, , 4]);
                                    (0, fs_1.writeFileSync)(input, buf);
                                    console.log(chalk_1.default.magenta('🎬 Procesando sticker animado con FFmpeg...'));
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            (0, fluent_ffmpeg_1.default)(input)
                                                .outputOptions([
                                                '-vframes', '1',
                                                '-vf', 'scale=40:30',
                                                '-q:v', '31',
                                                '-preset', 'ultrafast'
                                            ])
                                                .save(output)
                                                .on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                                                var imageBuffer, terminalImg, _a;
                                                return __generator(this, function (_b) {
                                                    switch (_b.label) {
                                                        case 0:
                                                            _b.trys.push([0, 3, , 4]);
                                                            if (!(0, fs_1.existsSync)(output)) return [3 /*break*/, 2];
                                                            imageBuffer = (0, fs_1.readFileSync)(output);
                                                            return [4 /*yield*/, terminal_image_1.default.buffer(imageBuffer, {
                                                                    width: 20,
                                                                    height: 10,
                                                                    preserveAspectRatio: false
                                                                })];
                                                        case 1:
                                                            terminalImg = _b.sent();
                                                            console.log(chalk_1.default.magenta('📺'), terminalImg);
                                                            (0, fs_1.unlinkSync)(output);
                                                            _b.label = 2;
                                                        case 2: return [3 /*break*/, 4];
                                                        case 3:
                                                            _a = _b.sent();
                                                            return [3 /*break*/, 4];
                                                        case 4:
                                                            resolve();
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })
                                                .on('error', function () { return resolve(); });
                                        })];
                                case 2:
                                    _b.sent();
                                    if ((0, fs_1.existsSync)(input))
                                        (0, fs_1.unlinkSync)(input);
                                    return [3 /*break*/, 4];
                                case 3:
                                    _a = _b.sent();
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); };
                    if (!(messageContent === null || messageContent === void 0 ? void 0 : messageContent.imageMessage)) return [3 /*break*/, 21];
                    _v.label = 3;
                case 3:
                    _v.trys.push([3, 20, , 21]);
                    return [4 /*yield*/, (0, baileys_1.downloadContentFromMessage)(messageContent.imageMessage, 'image')];
                case 4:
                    stream = _v.sent();
                    buf = Buffer.from([]);
                    _v.label = 5;
                case 5:
                    _v.trys.push([5, 10, 11, 16]);
                    _s = true, stream_1 = __asyncValues(stream);
                    _v.label = 6;
                case 6: return [4 /*yield*/, stream_1.next()];
                case 7:
                    if (!(stream_1_1 = _v.sent(), _a = stream_1_1.done, !_a)) return [3 /*break*/, 9];
                    _c = stream_1_1.value;
                    _s = false;
                    try {
                        chunk = _c;
                        buf = Buffer.concat([buf, chunk]);
                    }
                    finally {
                        _s = true;
                    }
                    _v.label = 8;
                case 8: return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 16];
                case 10:
                    e_1_1 = _v.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 16];
                case 11:
                    _v.trys.push([11, , 14, 15]);
                    if (!(!_s && !_a && (_b = stream_1.return))) return [3 /*break*/, 13];
                    return [4 /*yield*/, _b.call(stream_1)];
                case 12:
                    _v.sent();
                    _v.label = 13;
                case 13: return [3 /*break*/, 15];
                case 14:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 15: return [7 /*endfinally*/];
                case 16:
                    if (!(buf === null || buf === void 0 ? void 0 : buf.length)) return [3 /*break*/, 18];
                    return [4 /*yield*/, mostrarImagen(buf)];
                case 17:
                    _v.sent();
                    return [3 /*break*/, 19];
                case 18:
                    console.log(chalk_1.default.yellow('⚠️ Imagen vacía o no disponible.'));
                    _v.label = 19;
                case 19: return [3 /*break*/, 21];
                case 20:
                    err_1 = _v.sent();
                    console.log(chalk_1.default.red('⚠️ Error mostrando imagen:'), err_1.message);
                    return [3 /*break*/, 21];
                case 21:
                    if (!(messageContent === null || messageContent === void 0 ? void 0 : messageContent.stickerMessage)) return [3 /*break*/, 40];
                    _v.label = 22;
                case 22:
                    _v.trys.push([22, 39, , 40]);
                    msgContent = messageContent.stickerMessage;
                    isAnimated = (msgContent === null || msgContent === void 0 ? void 0 : msgContent.isAnimated) || false;
                    return [4 /*yield*/, (0, baileys_1.downloadContentFromMessage)(msgContent, 'sticker')];
                case 23:
                    stream = _v.sent();
                    buf = Buffer.from([]);
                    _v.label = 24;
                case 24:
                    _v.trys.push([24, 29, 30, 35]);
                    _t = true, stream_2 = __asyncValues(stream);
                    _v.label = 25;
                case 25: return [4 /*yield*/, stream_2.next()];
                case 26:
                    if (!(stream_2_1 = _v.sent(), _d = stream_2_1.done, !_d)) return [3 /*break*/, 28];
                    _f = stream_2_1.value;
                    _t = false;
                    try {
                        chunk = _f;
                        buf = Buffer.concat([buf, chunk]);
                    }
                    finally {
                        _t = true;
                    }
                    _v.label = 27;
                case 27: return [3 /*break*/, 25];
                case 28: return [3 /*break*/, 35];
                case 29:
                    e_2_1 = _v.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 35];
                case 30:
                    _v.trys.push([30, , 33, 34]);
                    if (!(!_t && !_d && (_e = stream_2.return))) return [3 /*break*/, 32];
                    return [4 /*yield*/, _e.call(stream_2)];
                case 31:
                    _v.sent();
                    _v.label = 32;
                case 32: return [3 /*break*/, 34];
                case 33:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 34: return [7 /*endfinally*/];
                case 35:
                    if (!(buf === null || buf === void 0 ? void 0 : buf.length)) return [3 /*break*/, 37];
                    return [4 /*yield*/, mostrarImagen(buf, true, isAnimated)];
                case 36:
                    _v.sent();
                    return [3 /*break*/, 38];
                case 37:
                    console.log(chalk_1.default.cyan('🎭'));
                    _v.label = 38;
                case 38: return [3 /*break*/, 40];
                case 39:
                    err_2 = _v.sent();
                    console.log(chalk_1.default.red('⚠️ Error mostrando sticker:'), err_2.message);
                    console.log(chalk_1.default.cyan('\n🎭 ═════════ STICKER PLACEHOLDER ═════════'));
                    console.log('┌──────────────────────────────────────────┐');
                    console.log('│            🎭 STICKER RECIBIDO           │');
                    console.log('│         ┌────────────────┐              │');
                    console.log('│         │   ( ◉    ◉ )   │              │');
                    console.log('│         │       ▽        │              │');
                    console.log('│         │    ╰─────╯     │              │');
                    console.log('│         └────────────────┘              │');
                    console.log('│  ⚠️ No se pudo mostrar imagen real       │');
                    console.log('└──────────────────────────────────────────┘');
                    console.log('═══════════════════════════════════════════════\n');
                    return [3 /*break*/, 40];
                case 40:
                    if (!((_p = (_o = (_m = (_l = m.message) === null || _l === void 0 ? void 0 : _l.extendedTextMessage) === null || _m === void 0 ? void 0 : _m.contextInfo) === null || _o === void 0 ? void 0 : _o.mentionedJid) === null || _p === void 0 ? void 0 : _p.length)) return [3 /*break*/, 44];
                    console.log(chalk_1.default.cyan('🔔 Menciones:'));
                    _i = 0, _u = m.message.extendedTextMessage.contextInfo.mentionedJid;
                    _v.label = 41;
                case 41:
                    if (!(_i < _u.length)) return [3 /*break*/, 44];
                    jid = _u[_i];
                    cleanJid = jid.replace(/:\d+/, '');
                    return [4 /*yield*/, getName(cleanJid)];
                case 42:
                    name = _v.sent();
                    user = (0, awesome_phonenumber_1.default)('+' + cleanJid.replace(/@.*/, '')).getNumber('international') || cleanJid.replace(/@.*/, '');
                    console.log(chalk_1.default.cyan("   ".concat(user, " ").concat(name ? '~ ' + name : '')));
                    _v.label = 43;
                case 43:
                    _i++;
                    return [3 /*break*/, 41];
                case 44:
                    messageId = ((_q = m.key.id) === null || _q === void 0 ? void 0 : _q.substring(0, 8)) + '...';
                    console.log();
                    console.log(chalk_1.default.green("\uD83D\uDCD6 Mensaje le\u00EDdo | ID: ".concat(messageId)));
                    console.log();
                    cleanExpiredCache();
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = printMessage;
function cleanExpiredCache() {
    if (Math.random() < 0.1) {
        var now_1 = Date.now();
        Array.from(stickerCache.entries()).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (now_1 - value.timestamp > CACHE_DURATION) {
                stickerCache.delete(key);
            }
        });
    }
}
