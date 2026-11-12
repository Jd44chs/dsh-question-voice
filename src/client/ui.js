/**
 * Browser half of dsh-question-voice, hand-authored in the ModuleLoader shape
 * the DSH web client loads third-party client entries with:
 *
 *   window.__ModuleLoader__.load({ id, factory: (require) => module.exports })
 *
 * Only `react` and `react-dom/client` come from the host (they are the two
 * modules the loader serves to third-party client code); everything else is
 * plain DOM, so the bundle needs no build step and no esbuild dependency.
 *
 * The question card has no slot of its own, so the button is attached to the
 * card's answer field by observing the document, and the transcript is written
 * back through React's own input path: the native `value` setter followed by a
 * bubbling `input` event, which reaches the card's onChange and its draft store.
 */
window.__ModuleLoader__.load({
  id: 'dsh-question-voice',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')
    var ReactDomClient = require('react-dom/client')
    var createRoot = ReactDomClient.createRoot
    var h = React.createElement

    var BUTTON_ATTR = 'data-dsh-question-voice'
    var BUILD_TAG = 'v0.1.0-20261112-1510'
    var STYLE_ID = 'dsh-question-voice/style-' + BUILD_TAG

    var TEXT = {
      zh: {
        start: '语音输入',
        stop: '停止并转写',
        busy: '转写中…',
        labelIdle: '说话',
      idle: '说话',
        labelStop: '停止并识别',
        labelBusy: '转写中…',
        hintClickAgain: '再点一下「停止并识别」就出文字',
        cancel: '取消录音',
        failed: '转写失败：{message}',
        empty: '没听清，再说一次',
        noSpeech: '没找到语音识别服务，请确认「语音输入」已开启',
        tooLarge: '录音太长，请缩短',
        locked: '这一题已经锁定，不能再输入',
        mic: '麦克风打不开：{message}',
      },
      en: {
        start: 'Voice input',
        stop: 'Stop and transcribe',
        busy: 'Transcribing…',
        labelIdle: 'Speak',
        labelStop: 'Stop & transcribe',
        labelBusy: 'Transcribing…',
        hintClickAgain: 'Tap "Stop & transcribe" again to get the text',
        cancel: 'Cancel recording',
        failed: 'Transcription failed: {message}',
        empty: 'Nothing recognised, try again',
        noSpeech: 'No speech service — enable the voice-input plugin',
        tooLarge: 'Recording too long, please shorten',
        locked: 'This answer is locked',
        mic: 'Microphone unavailable: {message}',
      },
    }

    var CSS =
      '.dqv-slot{align-items:flex-end;justify-content:flex-end;display:inline-flex;flex:0 0 auto;line-height:0;min-height:24px}' +
      '.dqv-btn{position:relative;align-items:center;justify-content:center;display:inline-flex;flex:0 0 auto;width:30px;height:30px;padding:0;border:0;border-radius:8px;color:var(--dsw-alias-label-secondary,rgba(120,120,120,.95));background:0 0;cursor:pointer;transition:background-color .12s,color .12s}' +
      '.dqv-btn:hover{color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}' +
      '.dqv-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4285f4);outline-offset:1px}' +
      '.dqv-btn[data-phase="requesting"],.dqv-btn[data-phase="transcribing"]{cursor:progress}' +
      '.dqv-btn:disabled{color:var(--dsw-alias-label-dimmed,rgba(150,150,150,.6));cursor:default;background:0 0}' +
      '.dqv-dot{position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-error-primary,#e5484d)}' +
      '.dqv-bar{box-shadow:0 0 0 1px rgba(120,120,140,.06),0 2px 8px rgba(0,0,0,.06);display:flex;align-items:center;gap:6px;height:38px;padding:0 5px 0 6px;margin-right:2px;border:1px solid var(--dsw-alias-border-secondary,rgba(127,127,127,.26));border-radius:999px;background:var(--dsw-alias-bg-primary,rgba(127,127,127,.06));box-sizing:border-box;line-height:1}' +
      '.dqv-wave{display:flex;align-items:center;justify-content:center;gap:2px;height:34px;width:96px;overflow:hidden}' +
      '.dqv-wave[data-skin="A"]{align-items:center;gap:2px;width:96px}' +
      '.dqv-wave[data-skin="A"] i{width:2px;height:30px;transform-origin:center;border-radius:1px}' +
      '.dqv-wave[data-skin="B"]{align-items:flex-end;gap:2px;width:96px}' +
      '.dqv-wave[data-skin="B"] i{width:2px;height:30px;transform-origin:bottom;border-radius:1px}' +
      '.dqv-wave[data-skin="C"]{align-items:center;gap:2px;width:96px}' +
      '.dqv-wave[data-skin="C"] i{width:3px;height:30px;transform-origin:center;border-radius:2px}' +
      '.dqv-wave[data-skin="C"] i:nth-child(odd){opacity:.7}' +
      '.dqv-wave i{display:block;flex:0 0 auto;width:2px;height:30px;border-radius:1px;background:var(--dsw-alias-label-secondary,rgba(120,120,120,.85));transform:scaleY(.08);transform-origin:center;will-change:transform;transition:transform .04s linear,opacity .1s linear}' +
      '.dqv-time{font-variant-numeric:tabular-nums;font-size:11px;line-height:1;color:var(--dsw-alias-label-secondary,rgba(120,120,120,.95));min-width:28px;text-align:center}' +
      '.dqv-stop{align-items:center;justify-content:center;display:inline-flex;flex:0 0 auto;width:22px;height:22px;padding:0;border:0;border-radius:50%;color:#fff;background:var(--dsw-alias-label-primary,#3a3a3a);cursor:pointer;transition:opacity .12s}' +
      '.dqv-stop:hover{opacity:.82}' +
      '.dqv-cancel{align-items:center;justify-content:center;display:inline-flex;flex:0 0 auto;width:22px;height:22px;padding:0;border:0;border-radius:50%;background:0 0;color:var(--dsw-alias-label-secondary,rgba(120,120,120,.95));cursor:pointer}' +
      '.dqv-cancel:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));color:var(--dsw-alias-label-primary,inherit)}' +
      '@keyframes dqv-spin{to{transform:rotate(360deg)}}' +
      '.dqv-spin{animation:dqv-spin .9s linear infinite}'

    /**
     * Diagnostic trail. Every state change of the button plus every remote call
     * lands in a ring buffer that survives reloads (`dqv:log`) and in
     * `window.__dqv`, so a failure can be read back without opening devtools.
     */
    var LOG_KEY = 'dqv:log'

    function log(scope, message, detail) {
      var line = '[dqv] ' + scope + ' ' + message
      try {
        if (detail !== undefined) line += ' ' + JSON.stringify(detail)
      } catch (error) {
        line += ' <unserialisable>'
      }
      try {
        console.log(line)
      } catch (error) {}
      var state = (window.__dqv = window.__dqv || { lines: [], last: null })
      state.last = line
      state.lines.push(line)
      if (state.lines.length > 60) state.lines.shift()
      try {
        var kept = (JSON.parse(window.localStorage.getItem(LOG_KEY) || '[]') || []).slice()
        kept.push(new Date().toISOString().slice(11, 19) + ' ' + line)
        while (kept.length > 120) kept.shift()
        window.localStorage.setItem(LOG_KEY, JSON.stringify(kept))
      } catch (error) {}
    }

    /** Report boot + environment once, so a silent plugin is still visible. */
    function bootReport(ctx) {
      log('boot', 'client loaded', { href: location.href.slice(0, 60) })
      var remote = speechOf(ctx)
      log('boot', 'speech=' + (remote ? Object.keys(remote).join(',') : 'missing'))
      log('boot', 'remote keys=' + (ctx.remote ? Object.keys(ctx.remote).join(',') : 'no remote'))
    }

    /** Best-effort description of a remote reply for the log. */
    function describe(value) {
      if (value === null || value === undefined) return String(value)
      if (typeof value !== 'object') return value
      var shape = {}
      for (var key in value) {
        var item = value[key]
        if (Array.isArray(item)) shape[key] = 'array(' + item.length + ')'
        else if (item !== null && typeof item === 'object') shape[key] = 'object'
        else shape[key] = item
      }
      return shape
    }

    function messages() {
      var lang = (typeof document === 'undefined' ? '' : document.documentElement.lang || '').toLowerCase()
      return lang === '' || lang.indexOf('zh') === 0 ? TEXT.zh : TEXT.en
    }

    function ensureStyle() {
      if (document.getElementById(STYLE_ID) !== null) return
      var tag = document.createElement('style')
      tag.id = STYLE_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function encodeWave(samples) {
      var bytes = new Uint8Array(44 + samples.length * 2)
      var view = new DataView(bytes.buffer)
      var text = function (at, value) {
        for (var i = 0; i < value.length; i += 1) bytes[at + i] = value.charCodeAt(i)
      }
      text(0, 'RIFF')
      view.setUint32(4, bytes.length - 8, true)
      text(8, 'WAVE')
      text(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, 16000, true)
      view.setUint32(28, 32000, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      text(36, 'data')
      view.setUint32(40, samples.length * 2, true)
      for (var i = 0; i < samples.length; i += 1) {
        var value = Math.max(-1, Math.min(1, samples[i]))
        view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true)
      }
      return bytes
    }

    function audioBase64(bytes) {
      var text = ''
      for (var i = 0; i < bytes.length; i += 8192) {
        text += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, bytes.length)))
      }
      return btoa(text)
    }

    function unwrap(result) {
      if (result && typeof result === 'object' && 'ok' in result && 'value' in result) {
        if (result.ok !== true) {
          var failure = result.error
          throw new Error((failure && failure.message) || 'remote failed')
        }
        return result.value
      }
      return result
    }

    function speechOf(ctx) {
      try {
        if (ctx.remote && ctx.remote.speech) return ctx.remote.speech
      } catch (error) {}
      try {
        if (ctx.get && ctx.get('remote.speech')) return ctx.get('remote.speech')
      } catch (error) {}
      return undefined
    }

    /**
     * The speech Remote is NOT part of the static client composition: the
     * official voice-input plugin mounts it itself with `ctx.remote.$mount`.
     * `dsh-api-remotes` only carries a fixed list, so a third-party client has
     * to mount the same contribution before `remote.speech` exists.
     *
     * We declare just the one method we call. The gateway validates each
     * parameter's `codec` (not `strictCodec`), so the codec is `mode: "strict"`
     * while `create` is optional — without Zod the gateway skips decoding and
     * hands back the plain JSON reply, which is what `unwrap` expects.
     */
    var SPEECH_PACKAGE = '@deepseek-ai/dsh-experimental-api-speech-to-text'

    function speechContribution() {
      var codec = function (jsonSchema) {
        return { mode: 'strict', jsonSchema: jsonSchema }
      }
      return {
        package: SPEECH_PACKAGE,
        descriptors: [
          {
            id: SPEECH_PACKAGE + '#speech/transcribe',
            namespace: 'speech',
            method: 'transcribe',
            service: 'speechController',
            description: 'Validate and transcribe one recording through the explicit provider selection.',
            invocation: { kind: 'direct' },
            parameters: [
              {
                name: 'request',
                wire: 'request',
                description: 'canonical WAV encoded as base64, provider id and language hint.',
                source: 'json',
                codec: codec({
                  type: 'object',
                  properties: { audioBase64: { type: 'string' }, providerId: { type: 'string' }, language: { type: 'string' } },
                  required: ['audioBase64'],
                  additionalProperties: false,
                }),
              },
            ],
            cancellation: { parameter: 'signal' },
            result: { mode: 'strict', jsonSchema: { type: 'object' } },
          },
        ],
      }
    }

    /**
     * Mount the speech Remote once per page. The official voice-input plugin
     * already mounts it when that bundle is enabled; a "already mounted" or
     * "conflicts with an existing Remote namespace" rejection therefore means
     * the namespace is there and we simply use it.
     */
    function ensureSpeech(ctx) {
      var state = (window.__dqvRemote = window.__dqvRemote || { promise: null, mounted: false })
      if (state.promise) return state.promise
      state.promise = Promise.resolve()
        .then(function () {
          if (speechOf(ctx)) return 'present'
          if (!ctx.remote || typeof ctx.remote.$mount !== 'function') return 'missing'
          return Promise.resolve(ctx.remote.$mount(speechContribution())).then(
            function () {
              state.mounted = true
              return 'mounted'
            },
            function (error) {
              var message = String((error && error.message) || error)
              if (message.indexOf('already mounted') >= 0 || message.indexOf('existing Remote namespace') >= 0 || message.indexOf('conflicts with') >= 0) {
                return 'present'
              }
              throw error
            },
          )
        })
        .then(
          function (outcome) {
            log('mount', 'speech remote ' + outcome)
            return speechOf(ctx)
          },
          function (error) {
            log('mount', 'speech remote failed', String((error && error.message) || error))
            state.promise = null
            return undefined
          },
        )
      return state.promise
    }

    function readCatalog(remote) {
      if (!remote || typeof remote.catalog !== 'function') {
        throw new Error('no-speech')
      }
      return Promise.resolve(remote.catalog()).then(unwrap)
    }

    function warmUp(ctx, catalog) {
      var remote = speechOf(ctx)
      if (!remote || typeof remote.prepare !== 'function' || !catalog || !catalog.providers) return
      var selection = catalog.selection || {}
      for (var i = 0; i < catalog.providers.length; i += 1) {
        var provider = catalog.providers[i]
        if (provider.id !== selection.providerId) continue
        var phase = provider.preparation && provider.preparation.phase
        if (phase !== 'unprepared' && phase !== 'cancelled') return
        Promise.resolve(remote.prepare(selection.providerId)).catch(function () {})
        return
      }
    }

    /** One microphone acquisition for the answer field. */
    function Capture() {
      this.chunks = []
    }

    Capture.prototype.start = function start() {
      var self = this
      return navigator.mediaDevices
        .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
        .then(function (stream) {
          self.stream = stream
          self.recorder = new MediaRecorder(stream)
          self.recorder.ondataavailable = function (event) {
            if (event.data && event.data.size > 0) self.chunks.push(event.data)
          }
          self.context = new (window.AudioContext || window.webkitAudioContext)()
          if (typeof self.onStart === 'function') {
            try {
              self.onStart(self.context, stream)
            } catch (error) {}
          }
          self.recorder.start()
          return self
        })
    }

    Capture.prototype.dispose = function dispose() {
      try {
        if (this.recorder && this.recorder.state === 'recording') this.recorder.stop()
      } catch (error) {}
      if (this.stream) {
        this.stream.getTracks().forEach(function (track) {
          track.stop()
        })
      }
      this.stream = undefined
      this.recorder = undefined
      this.chunks = []
      var context = this.context
      this.context = undefined
      if (context && context.state !== 'closed') {
        return context.close().catch(function () {})
      }
      return Promise.resolve()
    }

    Capture.prototype.stop = function stop(maxDurationSeconds) {
      var self = this
      var recorder = this.recorder
      var context = this.context
      if (!recorder || recorder.state !== 'recording') {
        return Promise.resolve(this.dispose()).then(function () {
          throw new Error('empty')
        })
      }
      return new Promise(function (resolve, reject) {
        recorder.onstop = resolve
        recorder.onerror = function () {
          reject(new Error('empty'))
        }
        recorder.stop()
      })
        .then(function () {
          if (self.stream) {
            self.stream.getTracks().forEach(function (track) {
              track.stop()
            })
          }
          var blob = new Blob(self.chunks, { type: recorder.mimeType })
          if (blob.size === 0) throw new Error('empty')
          return blob.arrayBuffer()
        })
        .then(function (bytes) {
          return context.decodeAudioData(bytes)
        })
        .then(function (decoded) {
          var seconds = Math.max(0.05, Math.min(decoded.duration, maxDurationSeconds))
          var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext
          var offline = new Offline(1, Math.max(1, Math.floor(seconds * 16000)), 16000)
          var source = offline.createBufferSource()
          source.buffer = decoded
          source.connect(offline.destination)
          source.start()
          return offline.startRendering()
        })
        .then(function (rendered) {
          return encodeWave(rendered.getChannelData(0))
        })
        .then(
          function (wav) {
            return Promise.resolve(self.dispose()).then(function () {
              return wav
            })
          },
          function (error) {
            return Promise.resolve(self.dispose()).then(function () {
              throw error
            })
          },
        )
    }

        function pasteIntoCard(textarea, text) {
      var proto = textarea.constructor && textarea.constructor.prototype
      var descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : undefined
      var apply = descriptor && descriptor.set
      var start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : textarea.value.length
      var end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : textarea.value.length
      var before = textarea.value.slice(0, start)
      var after = textarea.value.slice(end)
      var spacer = before !== '' && !/[\s\n]$/.test(before) ? ' ' : ''
      var next = before + spacer + text + after
      if (apply) {
        apply.call(textarea, next)
      } else {
        textarea.value = next
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      var caret = before.length + spacer.length + text.length
      try {
        textarea.focus()
        textarea.setSelectionRange(caret, caret)
      } catch (error) {}
    }

    function glyph(phase) {
      if (phase === 'stop') {
        return h(
          'svg',
          { viewBox: '0 0 16 16', width: 10, height: 10, 'aria-hidden': 'true' },
          h('rect', { x: 2, y: 2, width: 12, height: 12, rx: 2.4, fill: 'currentColor' }),
        )
      }
      if (phase === 'cancel') {
        return h(
          'svg',
          { viewBox: '0 0 16 16', width: 11, height: 11, 'aria-hidden': 'true' },
          h('path', {
            d: 'M4 4l8 8M12 4l-8 8',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.7,
            strokeLinecap: 'round',
          }),
        )
      }
      if (phase === 'recording') {
        return h(
          'svg',
          { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
          h('rect', { x: 4.5, y: 4.5, width: 7, height: 7, rx: 1.6, fill: 'currentColor' }),
        )
      }
      if (phase === 'requesting' || phase === 'transcribing') {
        return h(
          'svg',
          { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', className: 'dqv-spin' },
          h('circle', {
            cx: 8,
            cy: 8,
            r: 5.4,
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.7,
            strokeDasharray: '22 12',
            strokeLinecap: 'round',
          }),
        )
      }
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
        h('rect', { x: 6, y: 1.4, width: 4, height: 8.2, rx: 2, fill: 'currentColor' }),
        h('path', {
          d: 'M3.6 7.6a4.4 4.4 0 0 0 8.8 0M8 12v2.4M5.6 14.4h4.8',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
        }),
      )
    }

    /**
     * Attach one button to one answer field.
     * @param anchor - Element the button is appended to.
     * @param textarea - The card's answer textarea.
     * @param ctx - Client runtime.
     */
    function attach(anchor, textarea, ctx) {
      var t = messages()
      var phase = 'idle'
      var capture
      var busy = false
      var notice = ''
      var levels = []
      var waveNode = null
      var smoothedLevel = 0
      var meterBars = []
      var lastMeterPaint = 0
      var LEVEL_COUNT = 24
      var elapsed = 0
      var ticker = null
      var meter = null
      var meterData = null
      var container = document.createElement('span')
      container.setAttribute(BUTTON_ATTR, '')
      container.className = 'dqv-slot'
      container.style.position = 'relative'
      // Append at the end of the answer row and pin to its right edge; the row
      // becomes a flex line so the textarea keeps its own width.
      if (window.getComputedStyle(anchor).display !== 'flex' && window.getComputedStyle(anchor).display !== 'inline-flex') {
        anchor.style.display = 'flex'
      }
      anchor.style.alignItems = 'flex-end'
      anchor.style.gap = '4px'
      container.style.zIndex = '5'
      container.style.pointerEvents = 'auto'
      var root = createRoot(container)

      function mmss(seconds) {
        var total = Math.max(0, Math.floor(seconds))
        var m = Math.floor(total / 60)
        var s = total % 60
        return m + ':' + (s < 10 ? '0' + s : String(s))
      }

      // 波形外观皮肤：A 中心对称（镜像）/ B 从底部生长 / C 粗圆角+交替色。
      // 读取 localStorage['dqv:skin']，可在不改代码的前提下切换用来对比观感。
      var SKINS = ['A', 'B', 'C']
      var SKIN_LABEL = { A: '中心镜像', B: '底部生长', C: '粗圆浑厚' }

      function currentSkin() {
        try {
          var raw = window.localStorage && window.localStorage.getItem('dqv:skin')
          if (raw && SKINS.indexOf(raw) >= 0) return raw
        } catch (error) {}
        return 'A'
      }

      function waveform() {
        return h('span', {
          className: 'dqv-wave',
          'data-skin': currentSkin(),
          ref: meterHost,
        })
      }

      // The meter renders the bars itself, once per mount, and then only sets
      // style on the existing nodes. Going through React state at 60fps would
      // re-render the whole card under the user's cursor.
      function meterHost(node) {
        waveNode = node || null
        if (!waveNode) return
        var bars = []
        for (var i = 0; i < LEVEL_COUNT; i += 1) {
          var bar = document.createElement('i')
          bar.className = 'dqv-wave-bar'
          bar.style.height = '30px'
          bar.style.transform = 'scaleY(0.1)'
          bar.style.opacity = '0.45'
          waveNode.appendChild(bar)
          bars.push(bar)
        }
        meterBars = bars
        paintMeter()
      }

      function paintMeter() {
        if (!waveNode || !meterBars.length) return
        var skin = currentSkin()
        var count = meterBars.length
        for (var i = 0; i < count; i += 1) {
          var value = levels[i] || 0
          var bar = meterBars[i]
          if (!bar || !bar.style) continue
          // scaleY lives on the compositor: no layout, no jank while speaking.
          if (skin === 'A') {
            // 中心对称：两端小、中间大，像一条会呼吸的声纹
            var mirror = 1 - Math.abs(i - (count - 1) / 2) / ((count - 1) / 2)
            var shaped = value * (0.3 + 0.7 * mirror)
            bar.style.transform = 'scaleY(' + (0.08 + shaped * 0.98).toFixed(2) + ')'
            bar.style.opacity = Math.min(1, 0.45 + shaped * 0.85).toFixed(2)
          } else if (skin === 'B') {
            // 底部生长：整根从下往上长，最直接
            bar.style.transform = 'scaleY(' + (0.06 + value * 0.96).toFixed(2) + ')'
            bar.style.opacity = Math.min(1, 0.5 + value * 0.75).toFixed(2)
          } else {
            // 粗圆浑厚：柱子更宽，幅度收一点，看起来更柔和
            bar.style.transform = 'scaleY(' + (0.1 + value * 0.92).toFixed(2) + ')'
            bar.style.opacity = Math.min(1, 0.55 + value * 0.7).toFixed(2)
          }
        }
      }

      function redraw() {
        if (!root) return
        if (phase === 'recording') {
          root.render(
            h(
              'div',
              { className: 'dqv-bar', 'data-phase': 'recording' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dqv-cancel',
                  title: t.cancel,
                  'aria-label': t.cancel,
                  onClick: cancelClick,
                },
                glyph('cancel')
              ),
              waveform(),
              h('span', { className: 'dqv-time' }, mmss(elapsed)),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dqv-stop',
                  title: t.stop,
                  'aria-label': t.stop,
                  onClick: onClick,
                },
                glyph('stop')
              )
            )
          )
          paintMeter()
          return
        }
        root.render(
          h(
            'button',
            {
              type: 'button',
              className: 'dqv-btn',
              'data-phase': phase,
              title: notice || t.idle,
              'aria-label': t.idle,
              disabled: phase === 'transcribing' || phase === 'requesting',
              onClick: onClick,
            },
            glyph(phase),
            notice ? h('span', { className: 'dqv-dot' }) : null
          )
        )
      }

      function cancelClick() {
        log('cancel', 'by user')
        void cancel()
      }

      function listen(ctxAudio, stream) {
        try {
          if (!ctxAudio) return
          var source = ctxAudio.createMediaStreamSource(stream)
          var analyser = ctxAudio.createAnalyser()
          analyser.fftSize = 512
          analyser.smoothingTimeConstant = 0.6
          source.connect(analyser)
          meterData = analyser
          var buffer = new Uint8Array(analyser.fftSize)
          var smoothed = 0
          var loop = function () {
            if (!meterData) return
            analyser.getByteTimeDomainData(buffer)
            var sum = 0
            var peak = 0
            for (var i = 0; i < buffer.length; i += 1) {
              var value = Math.abs(buffer[i] - 128) / 128
              sum += value * value
              if (value > peak) peak = value
            }
            // 自动增益：小声也能看到波动，又不会被大声压住
            var rms = Math.sqrt(sum / buffer.length)
            var gain = rms > 0.0008 ? Math.min(30, 0.34 / rms) : 0
            var level = Math.min(1, Math.max(rms * gain, peak * 2.6))
            level = Math.pow(level, 0.62)
            smoothed = smoothed * 0.28 + level * 0.72
            smoothedLevel = smoothed
            if (levels.length >= LEVEL_COUNT) levels.shift()
            levels.push(Math.max(0.08, smoothed))
            var now = Date.now()
            if (now - lastMeterPaint >= 33) {
              lastMeterPaint = now
              paintMeter()
            }
            meter = requestAnimationFrame(loop)
          }
          loop()
        } catch (error) {
          log('meter', 'failed', String((error && error.message) || error))
        }
      }

      function startClock() {
        if (ticker !== null) {
          clearInterval(ticker)
          ticker = null
        }
        if (levels.length === 0) {
          for (var i = 0; i < LEVEL_COUNT; i += 1) levels.push(0.1)
        }
        elapsed = 0
        var started = Date.now()
        ticker = setInterval(function () {
          elapsed = (Date.now() - started) / 1000
          redraw()
        }, 250)
      }

      function stopClock() {
        if (ticker !== null) {
          clearInterval(ticker)
          ticker = null
        }
        if (meter !== null) {
          cancelAnimationFrame(meter)
          meter = null
        }
        meterData = null
        levels = []
      }

      function hint(message) {
        notice = message || ''
        redraw()
        clearTimeout(hint.timer)
        if (notice !== '') {
          hint.timer = setTimeout(function () {
            notice = ''
            redraw()
          }, 5000)
        }
      }

      function setPhase(next) {
        if (next !== 'recording' && next !== 'requesting') stopClock()
        phase = next
        redraw()
      }
      function cancel() {
        var active = capture
        capture = undefined
        if (active) clearTimeout(active.autoStop)
        busy = false
        setPhase('idle')
        return active ? active.dispose() : Promise.resolve()
      }

      function onClick() {
        log('click', 'phase=' + phase + ' busy=' + busy)
        if (textarea.disabled === true) {
          hint(t.locked)
          return
        }
        if (phase === 'recording') {
          void finish()
          return
        }
        if (busy) return
        busy = true
        setPhase('requesting')
        hint('')
        ensureSpeech(ctx)
          .then(function (remote) {
            log('remote', remote ? Object.keys(remote).join(',') : 'missing')
            return readCatalog(remote)
          })
          .then(function (catalog) {
            log('catalog', 'ok', describe(catalog))
            warmUp(ctx, catalog)
            var active = new Capture()
            active.onStart = function (ctxAudio, stream) {
              listen(ctxAudio, stream)
            }
            capture = active
            return active.start().then(function () {
              if (capture !== active) {
                return active.dispose()
              }
              log('capture', 'recording')
              setPhase('recording')
              startClock()
              // Auto-stop mirrors the chat composer: recording ends on its own
              // at the provider's limit, but the user stops it when done.
              clearTimeout(active.autoStop)
              active.autoStop = setTimeout(function () {
                if (capture === active && phase === 'recording') void finish()
              }, ((catalog && catalog.maxDurationSeconds) || 60) * 1000)
            })
          })
          .catch(function (cause) {
            var message = String((cause && cause.message) || cause)
            log('start', 'failed', message)
            busy = false
            setPhase('idle')
            if (message === 'no-speech') hint(t.noSpeech)
            else if (message.indexOf('Permission') >= 0 || message.indexOf('NotAllowed') >= 0 || message.indexOf('NotFound') >= 0) {
              hint(t.mic.replace('{message}', message))
            } else hint(t.failed.replace('{message}', message))
          })
      }

      function finish() {
        var active = capture
        if (!active) {
          busy = false
          setPhase('idle')
          return Promise.resolve()
        }
        capture = undefined
        clearTimeout(active.autoStop)
        setPhase('transcribing')
        var remote = speechOf(ctx)
        var catalog
        return readCatalog(remote)
          .catch(function () {
            return undefined
          })
          .then(function (value) {
            catalog = value
            var maxSeconds = (catalog && catalog.maxDurationSeconds) || 60
            return active.stop(maxSeconds)
          })
          .then(function (wav) {
            log('wav', 'bytes=' + wav.byteLength)
            var maxBytes = (catalog && catalog.maxAudioBytes) || 8 * 1024 * 1024
            if (wav.byteLength > maxBytes) {
              hint(t.tooLarge)
              return undefined
            }
            if (!remote || typeof remote.transcribe !== 'function') {
              hint(t.noSpeech)
              return undefined
            }
            var payload = { audioBase64: audioBase64(wav) }
            var selection = (catalog && catalog.selection) || {}
            for (var key in selection) {
              if (key !== 'providerId' || selection[key] !== undefined) payload[key] = selection[key]
            }
            log('transcribe', 'request', describe(selection))
            return Promise.resolve(remote.transcribe(payload)).then(
              function (raw) {
                log('transcribe', 'reply', describe(raw))
                return unwrap(raw)
              },
              function (error) {
                log('transcribe', 'rejected', String((error && error.message) || error))
                throw error
              },
            )
          })
          .then(function (result) {
            if (!result) return
            var text = String(result.text || '').trim()
            log('result', 'text=' + JSON.stringify(text.slice(0, 40)))
            if (text === '') {
              hint(t.empty)
              return
            }
            pasteIntoCard(textarea, text)
            log('paste', 'ok len=' + text.length)
          })
          .catch(function (cause) {
            log('finish', 'failed', String((cause && cause.message) || cause))
            hint(t.failed.replace('{message}', String((cause && cause.message) || cause)))
          })
          .then(function () {
            busy = false
            setPhase('idle')
          })
      }

      function onKeydown(event) {
        if (event.key === 'Escape' && (phase === 'recording' || phase === 'requesting')) {
          event.preventDefault()
          event.stopPropagation()
          void cancel()
        }
      }

      function onHidden() {
        if (document.hidden) void cancel()
      }

      function onBlur() {
        // Tab switches and transient focus moves must not kill a recording.
        if (phase === 'recording' && document.hidden) void cancel()
      }

      function onPointerDown(event) {
        if (phase === 'recording' && !container.contains(event.target)) {
          hint(t.hintClickAgain)
        }
      }

      document.addEventListener('keydown', onKeydown, true)
      document.addEventListener('visibilitychange', onHidden)
      window.addEventListener('blur', onBlur)
      document.addEventListener('pointerdown', onPointerDown, true)

      redraw()
      anchor.appendChild(container)

      return {
        unmount: function unmount() {
          document.removeEventListener('keydown', onKeydown, true)
          document.removeEventListener('visibilitychange', onHidden)
          window.removeEventListener('blur', onBlur)
          void cancel()
          setTimeout(function () {
            try {
              root.unmount()
            } catch (error) {}
            container.remove()
          }, 0)
        },
      }
    }

    function fields() {
      var found = []
      var seen = new Set()
      var rows = document.querySelectorAll('.wnLwla_customRow, .wnLwla_customBlock')
      for (var i = 0; i < rows.length; i += 1) {
        var row = rows[i]
        var textarea = row.querySelector('textarea')
        if (!textarea || seen.has(textarea)) continue
        seen.add(textarea)
        // Sit on the row itself, not inside the field box, and push to the end:
        // the button belongs on the right edge of the answer line, the way the
        // chat composer puts its mic on the right.
        var anchor = row
        found.push({ anchor: anchor, textarea: textarea })
      }
      return found
    }

    function apply(ctx) {
      log('build', BUILD_TAG)
      if (typeof document === 'undefined' || !document.body) return
      ensureStyle()
      bootReport(ctx)
      // Mount early so the namespace is ready before the first click; a failure
      // is logged and retried on click.
      void ensureSpeech(ctx)
      var records = new Map()
      var scheduled = false

      function sync() {
        scheduled = false
        var live = fields()
        var seen = new Set()
        for (var i = 0; i < live.length; i += 1) {
          var item = live[i]
          seen.add(item.textarea)
          if (records.has(item.textarea)) continue
          if (!item.anchor || item.anchor.querySelector('[' + BUTTON_ATTR + ']') !== null) continue
          records.set(item.textarea, attach(item.anchor, item.textarea, ctx))
          log('mount', 'button attached', { fields: live.length })
        }
        records.forEach(function (record, textarea) {
          if (seen.has(textarea)) return
          record.unmount()
          records.delete(textarea)
        })
      }

      function kick() {
        if (scheduled) return
        scheduled = true
        queueMicrotask(sync)
      }

      var observer = new MutationObserver(kick)
      observer.observe(document.body, { childList: true, subtree: true })
      kick()

      var dispose = function () {
        observer.disconnect()
        records.forEach(function (record) {
          record.unmount()
        })
        records.clear()
      }
      if (typeof ctx.on === 'function') ctx.on('dispose', dispose)
      return dispose
    }

    exports.apply = apply
    exports.name = 'dsh-question-voice'
    exports.inject = ['remote', 'sessions']
    return module.exports
  },
})
