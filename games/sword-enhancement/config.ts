export const settings={maxLevel:25,initialGold:5000,rescueGold:500,shareLevel:15,shareSale:50000,boostBonus:10};
export const tiers=[
 {level:0,name:'낡은 검'},{level:3,name:'철검'},{level:6,name:'강철검'},
 {level:9,name:'기사의 검'},{level:12,name:'미스릴 검'},{level:15,name:'용사의 검'},
 {level:18,name:'용살검'},{level:20,name:'전설의 검'},{level:21,name:'결재 절단검'},
 {level:22,name:'야근 파괴검'},{level:23,name:'관리자 승인 검'},{level:24,name:'퇴근의 검'},{level:25,name:'영원한 휴가의 검'},
];
// All chances are absolute percentages, not conditional failure percentages.
export const enhancementLevels=Array.from({length:settings.maxLevel+1},(_,level)=>({
 level,successRate:level<5?95-level*4:level<10?75-(level-5)*5:level<15?50-(level-10)*4:level<20?30-(level-15)*3:Math.max(5,15-(level-20)*2),
 downgradeChance:level<5?0:level<10?5:level<15?25:level<20?35:40,
 destroyChance:level<15?0:level<20?5+(level-15)*2:15+(level-20)*2,
 cost:Math.round(50*1.38**level),sellValue:level===0?0:Math.round(120*1.65**level),power:Math.round(10*1.3**level),
}));
export const shop=[{id:'starter',name:'강철검 +6',price:1500},{id:'boost',name:'성공 보조권 (+10%p·1회)',price:500},{id:'shield',name:'파괴 방지권 (파괴 판정 시 1회)',price:3000}] as const;
