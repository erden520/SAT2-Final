/* --- Yüz Tanıma Modülü Scriptleri --- */
const faceWorkspace = document.getElementById('face-workspace');

if (faceWorkspace) {
    const imageUpload = document.getElementById('imageUpload');
    const sourceImage = document.getElementById('sourceImage');
    const resultArea = document.getElementById('resultArea');
    const statusText = document.getElementById('statusText');
    const noFaceText = document.getElementById('noFaceText');

    Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
    ]).then(() => {
        statusText.innerHTML = '<i class="fas fa-check-circle text-success"></i> Sistem Hazır. Fotoğraf Seçebilirsiniz.';
        statusText.classList.replace('text-warning', 'text-success');
        imageUpload.disabled = false;
    });

    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        statusText.innerHTML = '<i class="fas fa-cog fa-spin text-primary"></i> Yapay zeka fotoğrafı inceliyor...';
        resultArea.innerHTML = '';

        const img = await faceapi.bufferToImage(file);
        sourceImage.src = img.src;
        sourceImage.style.display = 'block';

        sourceImage.onload = async () => {
            const detections = await faceapi.detectAllFaces(sourceImage).withFaceLandmarks().withFaceDescriptors();

            if (detections.length === 0) {
                statusText.innerHTML = '<i class="fas fa-times-circle text-danger"></i> Yüz bulunamadı, başka fotoğraf deneyin.';
                resultArea.appendChild(noFaceText);
                return;
            }

            statusText.innerHTML = `<i class="fas fa-check text-success"></i> Tam ${detections.length} yüz bulundu ve kırpıldı!`;

            detections.forEach((detection, i) => {
                const box = detection.detection.box;
                const canvas = document.createElement('canvas');

                const padding = 30;
                canvas.width = box.width + (padding * 2);
                canvas.height = box.height + (padding * 2);

                const ctx = canvas.getContext('2d');

                ctx.drawImage(
                    sourceImage,
                    box.x - padding, box.y - padding, box.width + (padding * 2), box.height + (padding * 2),
                    0, 0, canvas.width, canvas.height
                );

                const wrapper = document.createElement('div');
                wrapper.className = 'cropped-face-card';

                const faceImg = document.createElement('img');
                faceImg.src = canvas.toDataURL('image/jpeg', 0.9);

                const downloadBtn = document.createElement('a');
                downloadBtn.href = faceImg.src;
                downloadBtn.download = `yuz_kirpilmis_${i + 1}.jpg`;
                downloadBtn.className = 'btn btn-sm btn-success w-100';
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> İndir';

                wrapper.appendChild(faceImg);
                wrapper.appendChild(downloadBtn);
                resultArea.appendChild(wrapper);
            });
        };
    });
}



/* --- QR & Barkod Modülü Scriptleri --- */
const qrWorkspace = document.getElementById('qr-workspace');

if (qrWorkspace) {
    const qrTextInput = document.getElementById('qrTextInput');
    const generateQrBtn = document.getElementById('generateQrBtn');
    const qrCodeOutput = document.getElementById('qrCodeOutput');
    const downloadQrBtn = document.getElementById('downloadQrBtn');
    let qrcode = null;

    generateQrBtn.addEventListener('click', () => {
        const text = qrTextInput.value.trim();
        if (!text) {
            alert("Lütfen QR koda dönüştürülecek bir metin yazın!");
            return;
        }

        qrCodeOutput.innerHTML = '';

        qrcode = new QRCode(qrCodeOutput, {
            text: text,
            width: 200,
            height: 200,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        downloadQrBtn.style.display = 'block';
    });

    downloadQrBtn.addEventListener('click', () => {
        const imgObj = qrCodeOutput.querySelector('img');
        const canvasObj = qrCodeOutput.querySelector('canvas');

        let imgData = null;
        if (imgObj && imgObj.src) {
            imgData = imgObj.src;
        } else if (canvasObj) {
            imgData = canvasObj.toDataURL("image/png");
        }

        if (imgData) {
            const link = document.createElement('a');
            link.download = 'uretilen_karekod.png';
            link.href = imgData;
            link.click();
        }
    });


    const scanResult = document.getElementById('scanResult');

    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false
    );

    function onScanSuccess(decodedText, decodedResult) {
        scanResult.innerHTML = `<strong>Başarılı!</strong> Okunan Veri: <br> <span class="text-primary">${decodedText}</span>`;
        scanResult.classList.replace('alert-secondary', 'alert-success');
    }

    html5QrcodeScanner.render(onScanSuccess);
}



/* --- Medya Kaydedici Scriptleri --- */
const mediaWorkspace = document.getElementById('media-workspace');

if (mediaWorkspace) {
    const btnStartScreen = document.getElementById('btnStartScreen');
    const btnStopScreen = document.getElementById('btnStopScreen');
    const btnDownloadScreen = document.getElementById('btnDownloadScreen');
    const screenPreview = document.getElementById('screenPreview');
    const screenIndicator = document.getElementById('screenRecordingIndicator');

    let screenRecorder;

    btnStartScreen.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

            screenPreview.srcObject = stream;

            screenRecorder = new RecordRTC(stream, { type: 'video' });
            screenRecorder.startRecording();

            btnStartScreen.disabled = true;
            btnStopScreen.disabled = false;
            btnDownloadScreen.style.display = 'none';
            screenIndicator.style.display = 'block';

            stream.getVideoTracks()[0].onended = function () {
                if (!btnStopScreen.disabled) btnStopScreen.click();
            };

        } catch (error) {
            console.error("Ekran paylaşım izni reddedildi:", error);
            alert("Ekran kaydı yapabilmek için izin vermeniz gerekmektedir.");
        }
    });

    btnStopScreen.addEventListener('click', () => {
        screenRecorder.stopRecording(() => {
            const blob = screenRecorder.getBlob();

            screenPreview.srcObject = null;
            screenPreview.src = URL.createObjectURL(blob);
            screenPreview.controls = true;

            btnDownloadScreen.onclick = () => {
                invokeSaveAsDialog(blob, 'ekran_kaydi.webm');
            };

            btnStartScreen.disabled = false;
            btnStopScreen.disabled = true;
            btnDownloadScreen.style.display = 'inline-block';
            screenIndicator.style.display = 'none';

            screenRecorder.camera.getTracks().forEach(track => track.stop());
        });
    });


    const btnStartAudio = document.getElementById('btnStartAudio');
    const btnStopAudio = document.getElementById('btnStopAudio');
    const btnDownloadAudio = document.getElementById('btnDownloadAudio');
    const audioPreview = document.getElementById('audioPreview');
    const audioIndicator = document.getElementById('audioRecordingIndicator');
    const audioIcon = document.getElementById('audioIcon');

    let audioRecorder;

    btnStartAudio.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioRecorder = new RecordRTC(stream, { type: 'audio' });
            audioRecorder.startRecording();

            btnStartAudio.disabled = true;
            btnStopAudio.disabled = false;
            btnDownloadAudio.style.display = 'none';
            audioIndicator.style.display = 'block';
            audioIcon.classList.add('recording-pulse', 'text-danger');
            audioIcon.classList.remove('text-info');
            audioPreview.style.display = 'none';

        } catch (error) {
            console.error("Mikrofon izni reddedildi:", error);
            alert("Ses kaydı yapabilmek için mikrofon izni vermeniz gerekmektedir.");
        }
    });

    btnStopAudio.addEventListener('click', () => {
        audioRecorder.stopRecording(() => {
            const blob = audioRecorder.getBlob();

            audioPreview.src = URL.createObjectURL(blob);
            audioPreview.style.display = 'block';

            btnDownloadAudio.onclick = () => {
                invokeSaveAsDialog(blob, 'ses_kaydi.wav');
            };

            btnStartAudio.disabled = false;
            btnStopAudio.disabled = true;
            btnDownloadAudio.style.display = 'inline-block';
            audioIndicator.style.display = 'none';
            audioIcon.classList.remove('recording-pulse', 'text-danger');
            audioIcon.classList.add('text-info');

            audioRecorder.camera.getTracks().forEach(track => track.stop());
        });
    });
}



/* --- Veri Tablosu Modülü Scriptleri --- */
const datatableWorkspace = document.getElementById('datatable-workspace');

if (datatableWorkspace) {
    $('#advancedDataTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json',
        },
        dom: '<"row mb-3"<"col-md-6"B><"col-md-6 d-flex justify-content-end"f>>rt<"row mt-3"<"col-md-6"i><"col-md-6 d-flex justify-content-end"p>>',
        buttons: [
            {
                extend: 'excelHtml5',
                text: '<i class="fas fa-file-excel"></i> Excel İndir',
                className: 'btn btn-success btn-sm shadow-sm'
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="fas fa-file-pdf"></i> PDF İndir',
                className: 'btn btn-danger btn-sm shadow-sm'
            },
            {
                extend: 'print',
                text: '<i class="fas fa-print"></i> Yazdır',
                className: 'btn btn-info btn-sm text-white shadow-sm'
            }
        ],
        pageLength: 5,
        lengthMenu: [5, 10, 25, 50],
        order: [[0, 'asc']],
        columnDefs: [
            { width: "10%", targets: 0 },
            { width: "15%", targets: 5 }
        ]
    });
}



/* --- Video ve Ses Editörü Scriptleri --- */
const videoWorkspace = document.getElementById('video-workspace');

if (videoWorkspace) {
    const mediaUpload = document.getElementById('mediaUpload');
    const speedSelect = document.getElementById('speedSelect');
    const formatSelect = document.getElementById('formatSelect');
    const processBtn = document.getElementById('processBtn');
    const loadingArea = document.getElementById('loadingArea');
    const statusMessage = document.getElementById('statusMessage');

    const outputVideo = document.getElementById('outputVideo');
    const outputGif = document.getElementById('outputGif');
    const placeholderIcon = document.getElementById('placeholderIcon');
    const placeholderText = document.getElementById('placeholderText');
    const downloadMediaBtn = document.getElementById('downloadMediaBtn');

    const cropControls = document.getElementById('cropControls');
    const dualHandleSlider = document.getElementById('dualHandleSlider');
    const startValLabel = document.getElementById('startValLabel');
    const endValLabel = document.getElementById('endValLabel');

    let noUiSliderInstance;

    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });

    let selectedFile = null;

    mediaUpload.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            processBtn.disabled = false;

            if (selectedFile.type.startsWith('video/')) {
                const videoObj = document.createElement('video');
                videoObj.preload = 'metadata';

                videoObj.onloadedmetadata = function () {
                    window.URL.revokeObjectURL(videoObj.src);
                    const duration = Math.floor(videoObj.duration);

                    const sliderOptions = {
                        start: [0, duration],
                        connect: true,
                        range: {
                            'min': 0,
                            'max': duration
                        },
                        format: wNumb({
                            decimals: 0
                        }),
                        step: 1
                    };

                    if (noUiSliderInstance) {
                        noUiSliderInstance.updateOptions(sliderOptions);
                        noUiSliderInstance.set([0, duration]);
                    } else {
                        noUiSliderInstance = noUiSlider.create(dualHandleSlider, sliderOptions);

                        noUiSliderInstance.on('update', function (values, handle) {
                            if (handle === 0) {
                                startValLabel.innerText = values[0];
                            } else {
                                endValLabel.innerText = values[1];
                            }
                        });
                    }

                    startValLabel.innerText = 0;
                    endValLabel.innerText = duration;

                    cropControls.style.display = 'block';
                };
                videoObj.src = URL.createObjectURL(selectedFile);
            } else {
                cropControls.style.display = 'none';
                if (noUiSliderInstance) {
                    noUiSliderInstance.set([0, 0]);
                }
            }
        }
    });

    processBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        processBtn.style.display = 'none';
        loadingArea.style.display = 'block';
        outputVideo.style.display = 'none';
        outputGif.style.display = 'none';
        downloadMediaBtn.style.display = 'none';
        placeholderIcon.style.display = 'block';
        placeholderText.style.display = 'block';
        placeholderText.innerText = "Medya işleniyor, lütfen sekmeyi kapatmayın...";

        try {
            if (!ffmpeg.isLoaded()) {
                statusMessage.innerText = "FFmpeg Çekirdeği Yükleniyor...";
                await ffmpeg.load();
            }

            statusMessage.innerText = "Dosya Okunuyor...";
            const inputExt = getExtension(selectedFile.name);
            const inputName = 'input_file' + inputExt;
            ffmpeg.FS('writeFile', inputName, await fetchFile(selectedFile));

            const speed = parseFloat(speedSelect.value);
            const outFormat = formatSelect.value;
            const outputName = 'output_file.' + outFormat;

            const startVal = Math.floor(noUiSliderInstance.get(true)[0]);
            const endVal = Math.floor(noUiSliderInstance.get(true)[1]);

            statusMessage.innerText = "Render Ediliyor... Lütfen bekleyin.";

            let ffmpegArgs = [];

            if (startVal > 0) ffmpegArgs.push('-ss', startVal.toString());
            const duration = endVal - startVal;
            ffmpegArgs.push('-t', duration.toString());

            ffmpegArgs.push('-i', inputName);

            let filterString = "";
            const pts = (1 / speed).toFixed(2);

            if (outFormat === 'mp3') {
                filterString = `atempo=${speed}`;
                ffmpegArgs.push('-filter:a', filterString);
            } else if (outFormat === 'gif') {
                filterString = `[0:v]setpts=${pts}*PTS,fps=10,scale=320:-1:flags=lanczos[v]`;
                ffmpegArgs.push('-filter_complex', filterString, '-map', '[v]');
            } else {
                filterString = `[0:v]setpts=${pts}*PTS[v];[0:a]atempo=${speed}[a]`;
                ffmpegArgs.push('-filter_complex', filterString, '-map', '[v]', '-map', '[a]');
            }

            if (outFormat === 'mp3') {
                ffmpegArgs.push('-q:a', '0', outputName);
            } else if (outFormat === 'gif') {
                ffmpegArgs.push(outputName);
            } else {
                ffmpegArgs.push('-preset', 'ultrafast', '-movflags', '+faststart', outputName);
            }

            await ffmpeg.run(...ffmpegArgs);

            const data = ffmpeg.FS('readFile', outputName);
            let mimeType = outFormat === 'gif' ? 'image/gif' : (outFormat === 'mp3' ? 'audio/mp3' : 'video/mp4');
            const blob = new Blob([data.buffer], { type: mimeType });
            const url = URL.createObjectURL(blob);

            placeholderIcon.style.display = 'none';
            placeholderText.style.display = 'none';

            if (outFormat === 'gif') {
                outputGif.src = url;
                outputGif.style.display = 'block';
            } else {
                outputVideo.src = url;
                outputVideo.style.display = 'block';
                if (outFormat === 'mp4') {
                    outputVideo.load();
                }
            }

            downloadMediaBtn.href = url;
            downloadMediaBtn.download = `islenmis_medya.${outFormat}`;
            downloadMediaBtn.style.display = 'inline-block';

        } catch (error) {
            console.error("FFmpeg Hatası:", error);
            statusMessage.innerText = "Hata! İşlem başarısız oldu.";
        } finally {
            loadingArea.style.display = 'none';
            processBtn.style.display = 'block';
        }
    });

    function getExtension(filename) {
        return filename.substring(filename.lastIndexOf('.'));
    }
}



/* --- Takvim Modülü Scriptleri --- */
const calendarWorkspace = document.getElementById('calendar-workspace');

if (calendarWorkspace) {
    const calendarEl = document.getElementById('calendar');

    let savedEvents = JSON.parse(localStorage.getItem('myCalendarEvents')) || [];

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'tr',

        height: 700,    
        fixedWeekCount: true,
        dayMaxEvents: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Bugün',
            month: 'Ay',
            week: 'Hafta',
            day: 'Gün'
        },
        editable: true,
        selectable: true,
        events: savedEvents,

        dateClick: function (info) {
            const title = prompt('Etkinlik adını girin (Örn: Proje Teslimi, Toplantı):');

            if (title) {
                const newEvent = {
                    id: String(Date.now()),
                    title: title,
                    start: info.dateStr,
                    allDay: true
                };

                calendar.addEvent(newEvent);

                savedEvents.push(newEvent);
                localStorage.setItem('myCalendarEvents', JSON.stringify(savedEvents));
            }
        },

        eventDrop: function (info) {
            savedEvents = savedEvents.map(evt => {
                if (evt.id === info.event.id) {
                    evt.start = info.event.startStr;
                    if (info.event.endStr) {
                        evt.end = info.event.endStr;
                    }
                }
                return evt;
            });
            localStorage.setItem('myCalendarEvents', JSON.stringify(savedEvents));
        },

        eventClick: function (info) {
            if (confirm(`"${info.event.title}" adlı etkinliği silmek istediğinize emin misiniz?`)) {
                info.event.remove();

                savedEvents = savedEvents.filter(evt => evt.id !== info.event.id);
                localStorage.setItem('myCalendarEvents', JSON.stringify(savedEvents));
            }
        }
    });

    calendar.render();
}