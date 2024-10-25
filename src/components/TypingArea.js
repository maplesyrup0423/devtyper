import React, { useState, useEffect } from "react";
import "./TypingArea.css";

function TypingArea() {
  const [codeToType, setCodeToType] = useState(""); // 따라칠 텍스트
  const [userInput, setUserInput] = useState(""); // 사용자가 입력한 텍스트
  const [startTime, setStartTime] = useState(null); // 타이머 시작 시간
  const [currentTime, setCurrentTime] = useState(0); // 현재 타이머 값
  const [isFinished, setIsFinished] = useState(false); // 타이핑 완료 여부
  const [accuracy, setAccuracy] = useState(0); // 정확도
  const [wpm, setWpm] = useState(0); // WPM (타자 속도)
  const [fileLink, setFileLink] = useState(""); // 파일 출처 링크

  // GitHub API에서 lodash 레포지토리의 .js 파일을 가져오는 함수
  const fetchJSFilesFromGithub = async () => {
    const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN; // 환경 변수에서 토큰 가져오기

    try {
      const repo = "lodash/lodash"; // 특정 레포지토리
      const query = "extension:js"; // .js 파일 검색 쿼리
      const response = await fetch(
        `https://api.github.com/search/code?q=${query}+repo:${repo}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`, // 토큰을 인증 헤더에 추가
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      if (data.items.length > 0) {
        // 크기를 제한하지 않고 가져오기
        const randomItem =
          data.items[Math.floor(Math.random() * data.items.length)];
        fetchCodeSnippet(randomItem); // 랜덤 파일의 코드 스니펫 가져오기
      } else {
        console.log("크기가 적합한 파일이 없습니다.");
      }
    } catch (error) {
      console.error("에러 발생:", error.message);
    }
  };

  // GitHub에서 특정 파일의 코드 스니펫을 가져오는 함수
  const fetchCodeSnippet = async (item) => {
    try {
      const response = await fetch(item.url, {
        headers: {
          Authorization: `token ${process.env.REACT_APP_GITHUB_TOKEN}`, // 토큰을 인증 헤더에 추가
        },
      });

      if (!response.ok) {
        throw new Error(`코드 스니펫 요청 실패: ${response.status}`);
      }

      const codeData = await response.json();

      // Base64로 인코딩된 코드가 있는지 확인
      if (codeData.content) {
        // Base64 디코딩을 시도합니다.
        try {
          const decodedContent = atob(codeData.content); // Base64로 인코딩된 코드를 디코딩

          // 함수만 필터링하는 로직
          const functionRegex = /function\s+\w+\s*\(.*?\)\s*{[^}]*}/g; // 함수 정의를 찾는 정규 표현식
          const functions = decodedContent.match(functionRegex) || []; // 일치하는 함수들을 배열로 가져옴

          if (functions.length > 0) {
            // 랜덤으로 하나의 함수 선택
            const randomFunction =
              functions[Math.floor(Math.random() * functions.length)];
            setCodeToType(randomFunction); // 선택한 함수 설정
            setFileLink(item.html_url); // 파일 출처 링크 설정
          } else {
            console.log("파일에 함수가 없습니다. 다시 시도합니다.");
            fetchJSFilesFromGithub(); // 함수가 없으면 다시 파일을 가져옵니다.
          }
        } catch (decodeError) {
          console.error("Base64 디코딩 에러:", decodeError.message);
        }
      } else {
        console.log("코드 콘텐츠가 없습니다.");
      }
    } catch (error) {
      console.error("코드 스니펫 에러:", error.message);
    }
  };

  // 타이머가 작동하는 부분
  useEffect(() => {
    let timerInterval;

    if (startTime && !isFinished) {
      timerInterval = setInterval(() => {
        setCurrentTime(((new Date().getTime() - startTime) / 1000).toFixed(2)); // 경과 시간 (초 단위)
      }, 100); // 0.1초마다 업데이트
    }

    if (isFinished) {
      clearInterval(timerInterval); // 타이핑이 끝나면 타이머 멈춤
    }

    return () => clearInterval(timerInterval);
  }, [startTime, isFinished]);

  useEffect(() => {
    // 모든 공백 문자를 단일 공백으로 대체한 후 길이를 비교
    const cleanedUserInput = userInput.replace(/\s+/g, " ").trim();
    const cleanedCodeToType = codeToType.replace(/\s+/g, " ").trim();

    if (
      cleanedUserInput.length === cleanedCodeToType.length &&
      cleanedUserInput.length > 0
    ) {
      const endTime = new Date().getTime();
      setIsFinished(true);

      // 시간 계산 (분 단위)
      const timeTaken = (endTime - startTime) / 1000 / 60; // 분 단위 시간
      const correctChars = cleanedUserInput
        .split("")
        .filter((char, index) => char === cleanedCodeToType[index]).length;

      // 정확도 계산
      setAccuracy(((correctChars / cleanedCodeToType.length) * 100).toFixed(2));

      // 총 입력한 글자 수 기준 WPM 계산
      setWpm((cleanedUserInput.length / 5 / timeTaken).toFixed(2)); // 5글자 = 1 단어 기준
    }
  }, [userInput, codeToType, startTime]);

  const handleInputChange = (e) => {
    if (!startTime) {
      setStartTime(new Date().getTime()); // 첫 입력 시 타이머 시작
    }
    setUserInput(e.target.value);
  };

  const renderText = () => {
    // 비가시적인 공백 문자 제거
    const cleanedInput = userInput.replace(/\s+/g, " "); // 모든 공백 문자를 단일 공백으로 대체
    const cleanedCodeToType = codeToType.replace(/\s+/g, " "); // 모든 공백 문자를 단일 공백으로 대체

    return [...cleanedCodeToType].map((char, index) => {
      let bgColor = "black"; // 배경색 검정
      let color = "lightgray"; // 기본 텍스트 색상 회색

      if (index < cleanedInput.length) {
        if (cleanedInput[index] === char) {
          color = "green"; // 맞는 글자 초록색
        } else {
          bgColor = "red"; // 틀린 글자 배경 빨간색
          color = "white"; // 틀린 글자 흰색
        }
      }

      if (index === cleanedInput.length) {
        bgColor = "gray"; // 현재 위치 회색
      }

      return (
        <span
          key={index}
          style={{
            backgroundColor: bgColor,
            color: color,
          }}
        >
          {char}
        </span>
      );
    });
  };

  // 컴포넌트가 처음 렌더링될 때 .js 파일을 가져옵니다.
  useEffect(() => {
    fetchJSFilesFromGithub();
  }, []);

  return (
    <div className="typing-area">
      <h2>타자 연습</h2>
      <div className="code-container">
        <div>{renderText()}</div>
      </div>
      <textarea
        value={userInput}
        onChange={handleInputChange}
        placeholder="코드를 따라 입력하세요"
        style={{
          width: "100%",
          height: "100px",
          fontSize: "16px",
          backgroundColor: "black",
          color: "lightgray",
        }}
        autoComplete="off" // 자동 완성 비활성화
        spellCheck="false" // 맞춤법 검사 비활성화
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault(); // 기본 Tab 동작 방지
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;

            // Tab 추가
            setUserInput(
              userInput.substring(0, start) + "\t" + userInput.substring(end)
            );
            e.target.selectionStart = e.target.selectionEnd = start + 1; // 커서 위치 조정
          }
        }}
      />

      <div className="timer">
        <h3>타이머: {currentTime}초</h3>
      </div>
      <div>
        <p>
          출처:
          <a href={fileLink} target="_blank" rel="noopener noreferrer">
            {fileLink}
          </a>
        </p>
      </div>

      {isFinished && (
        <div>
          <h3>결과</h3>
          <p>정확도: {accuracy}%</p>
          <p>속도: {wpm} WPM</p>
        </div>
      )}
    </div>
  );
}

export default TypingArea;
