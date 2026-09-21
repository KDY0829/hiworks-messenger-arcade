// Client-safe metadata only. Server engines and dictionaries stay out of this module.
export const games=[
 {id:'kkutu',name:'끝말잇기',description:'순서대로 단어 이어가기',minPlayers:2},
 {id:'sword',name:'검 강화하기',description:'장비 강화·판매와 개인 기록',minPlayers:1},
 {id:'infiltrator',name:'AI 잠입자',description:'답변 속 AI 찾기',minPlayers:3},
 {id:'quiz',name:'상식 퀴즈',description:'채팅으로 푸는 주관식 퀴즈',minPlayers:1},
] as const;
