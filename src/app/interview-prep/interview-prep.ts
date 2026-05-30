import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.css'
  
})

export class InterviewPrep {

  isMuted = false;
  isListening = false;
  step = 1;
  jobRole = '';
  experience: number = 0;
  questions: string[] = [];
  currentIndex = 0;
  currentAnswer = '';
  isLoading = false;

  results: { question: string, answer: string, score: number, feedback: string }[] = [];
  weakAreas: string[] = [];
  overallScore = 0;

  private recognition: any = null;

  get progressPercent() {
    return ((this.currentIndex) / this.questions.length) * 100;
  }

  constructor(private http: HttpClient , private router: Router) {
    this.initSpeechRecognition();
  }
  GoToDashboard() {
  this.router.navigate(['/employees']);
}
  
  // ── Speech Recognition ────────────────────────────
  initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    let baseAnswer = '';  // stores confirmed words

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          baseAnswer += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Show confirmed + live interim text
      this.currentAnswer = baseAnswer + interimTranscript;
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access.');
      }
      this.isListening = false;
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();  // keep listening
      }
    };
  }

  toggleListening() {
    if (!this.recognition) {
      alert('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }

    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    } else {
      window.speechSynthesis.cancel();  // stop AI voice before mic starts
      this.currentAnswer = '';
      this.isListening = true;
      this.recognition.start();
    }
  }

  stopListening() {
    if (this.isListening) {
      this.isListening = false;
      this.recognition?.stop();
    }
  }

  // ── Text to Speech ────────────────────────────────
  private waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise(resolve => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
      }
    });
  }

  speakQuestion(text: string) {
    if (this.isMuted) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      this.waitForVoices().then(voices => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        const preferred = voices.find(v => v.name.includes('Google US English'));
        if (preferred) utterance.voice = preferred;

        window.speechSynthesis.speak(utterance);
      });
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      window.speechSynthesis.cancel();
    } else {
      this.speakQuestion(this.questions[this.currentIndex]);
    }
  }

  // ── Interview Flow ────────────────────────────────
  startInterview() {
  this.isLoading = true;

  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  this.http.post<any>('https://localhost:7288/api/interview/questions', {
    jobRole: this.jobRole,
    experience: this.experience
  }, { headers })
  .subscribe({         // ← no .pipe(timeout) at all
    next: (res: any) => {
      console.log('RESPONSE:', res);
      this.questions = res.questions;
      this.step = 2;
      this.isLoading = false;
      setTimeout(() => this.speakQuestion(this.questions[0]), 800);
    },
    error: (err: any) => {
      console.log('FULL ERROR:', err);
      console.log('STATUS:', err.status);
      console.log('ERROR BODY:', err.error);

      if (err.status === 429) {
        alert('⚠️ AI quota exhausted. Please try again tomorrow.');
      } else if (err.status === 503) {
        alert('⚠️ AI is busy. Please try again in a few minutes.');
      } else {
        alert('Error: ' + err.status + ' - ' + JSON.stringify(err.error));
      }
      this.isLoading = false;
    }
  });
}

  submitAnswer() {
    this.stopListening();  // stop mic before submitting
    this.isLoading = true;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<any>('https://prep-interview-4kyo.onrender.com/api/interview/rate', {
      jobRole: this.jobRole,
      question: this.questions[this.currentIndex],
      answer: this.currentAnswer
    }, { headers })
    .pipe(timeout(300000))
    .subscribe({
      next: (res: any) => {
        this.results.push({
          question: this.questions[this.currentIndex],
          answer: this.currentAnswer,
          score: res.score,
          feedback: res.feedback
        });
        this.nextQuestion();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.log('FULL ERROR:', err);
        alert('Failed to rate: ' + err.status);
        this.isLoading = false;
      }
    });
  }

  skipQuestion() {
    this.stopListening();  // stop mic on skip
    this.results.push({
      question: this.questions[this.currentIndex],
      answer: 'Skipped',
      score: 0,
      feedback: 'Question was skipped.'
    });
    this.nextQuestion();
  }

  nextQuestion() {
    this.currentAnswer = '';
    window.speechSynthesis.cancel();

    if (this.currentIndex + 1 < this.questions.length) {
      this.currentIndex++;
      setTimeout(() => this.speakQuestion(this.questions[this.currentIndex]), 500);
    } else {
      window.speechSynthesis.cancel();
      this.calculateResults();
      this.step = 3;
    }
  }

  calculateResults() {
    const total = this.results.reduce((sum, r) => sum + r.score, 0);
    this.overallScore = Math.round(total / this.results.length);

    this.weakAreas = this.results
      .filter(r => r.score < 5)
      .map(r => r.question.split(' ').slice(0, 5).join(' ') + '...');
  }

  restart() {
    this.stopListening();
    window.speechSynthesis.cancel();
    this.step = 1;
    this.jobRole = '';
    this.experience = 0;
    this.questions = [];
    this.currentIndex = 0;
    this.currentAnswer = '';
    this.results = [];
    this.weakAreas = [];
    this.overallScore = 0;
    this.isMuted = false;
    this.isListening = false;
  }
}
