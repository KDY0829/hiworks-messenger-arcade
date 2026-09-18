#ifndef UNICODE
#define UNICODE
#endif
#define _UNICODE
#define WIN32_LEAN_AND_MEAN
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0601
#endif
#include <windows.h>
#include <shellapi.h>
#include <wchar.h>
#include <stdio.h>

// A native Windows tray application hosting the Site in Edge's app window.
// It creates a separate browser profile; it never reads the normal Edge profile.
static const wchar_t *CLASS_NAME=L"OfficeChat.TrayHost.v1";
static const wchar_t *APP_URL=L"https://office-word-chat.i970829.chatgpt.site/?desktop=1";
static HWND hostWindow, browserWindow;
static DWORD browserPid;
static HICON appIcon;
static NOTIFYICONDATAW tray;
static UINT taskbarCreated;
static BOOL onTop=FALSE, launchPending=FALSE, quietHidden=FALSE;
static ULONGLONG launchedAt;
static wchar_t browserPath[MAX_PATH], profilePath[MAX_PATH];

static BOOL fileExists(const wchar_t *path){DWORD a=GetFileAttributesW(path);return a!=INVALID_FILE_ATTRIBUTES && !(a&FILE_ATTRIBUTE_DIRECTORY);}

static BOOL locateBrowser(void){
 const wchar_t *roots[]={L"ProgramFiles(x86)",L"ProgramFiles",L"LOCALAPPDATA"};
 wchar_t root[MAX_PATH];
 for(unsigned i=0;i<3;i++){
  DWORD n=GetEnvironmentVariableW(roots[i],root,MAX_PATH);if(!n || n>=MAX_PATH)continue;
  int count=swprintf(browserPath,MAX_PATH,L"%ls\\Microsoft\\Edge\\Application\\msedge.exe",root);
  if(count>0 && count<MAX_PATH && fileExists(browserPath))return TRUE;
 }
 return FALSE;
}

static BOOL CALLBACK findWindow(HWND window, LPARAM unused){
 (void)unused;
 if(window==hostWindow || GetWindow(window,GW_OWNER))return TRUE;
 wchar_t className[80],title[256];DWORD pid;
 GetClassNameW(window,className,80);
 if(wcscmp(className,L"Chrome_WidgetWin_1"))return TRUE;
 GetWindowThreadProcessId(window,&pid);GetWindowTextW(window,title,256);
 if(!wcsstr(title,L"OfficeChat"))return TRUE;
 if(pid==browserPid || wcsstr(title,L"OfficeChat")){
  // The fallback title is set only by this Site's desktop mode. Validate Edge.
  if(pid!=browserPid){
   HANDLE process=OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION,FALSE,pid);
   wchar_t image[MAX_PATH];DWORD length=MAX_PATH;
   BOOL match=process && QueryFullProcessImageNameW(process,0,image,&length) && !_wcsicmp(image,browserPath);
   if(process)CloseHandle(process);if(!match)return TRUE;
  }
  browserWindow=window;
  SetWindowPos(window,onTop?HWND_TOPMOST:HWND_NOTOPMOST,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE);
  SendMessageW(window,WM_SETICON,ICON_SMALL,(LPARAM)appIcon);
  if(quietHidden)ShowWindow(window,SW_HIDE);
  launchPending=FALSE;return FALSE;
 }
 return TRUE;
}

static void openChat(void){
 quietHidden=FALSE;
 if(browserWindow && IsWindow(browserWindow)){
  ShowWindow(browserWindow,SW_RESTORE);SetForegroundWindow(browserWindow);return;
 }
 if(launchPending)return;
 wchar_t command[2048];STARTUPINFOW startup={0};PROCESS_INFORMATION process={0};startup.cb=sizeof(startup);
 int n=swprintf(command,2048,L"\"%ls\" --app=\"%ls\" --user-data-dir=\"%ls\" --window-size=415,565 --no-first-run --disable-background-mode",browserPath,APP_URL,profilePath);
 if(n<0 || n>=2048 || !CreateProcessW(browserPath,command,NULL,NULL,FALSE,0,NULL,NULL,&startup,&process)){
  MessageBoxW(hostWindow,L"대화창을 열지 못했습니다. Microsoft Edge 설치와 회사 PC의 실행 정책을 확인해 주세요.",L"대화",MB_OK|MB_ICONINFORMATION);return;
 }
 browserPid=process.dwProcessId;CloseHandle(process.hThread);CloseHandle(process.hProcess);
 browserWindow=NULL;launchPending=TRUE;launchedAt=GetTickCount64();
}

static void addTray(void){Shell_NotifyIconW(NIM_ADD,&tray);}
static void trayMenu(void){
 HMENU menu=CreatePopupMenu();POINT cursor;GetCursorPos(&cursor);
 AppendMenuW(menu,MF_STRING,1,L"대화 열기");
 AppendMenuW(menu,MF_STRING|(onTop?MF_CHECKED:0),2,L"항상 위에 표시");
 AppendMenuW(menu,MF_STRING,3,L"창 숨기기");
 AppendMenuW(menu,MF_SEPARATOR,0,NULL);
 AppendMenuW(menu,MF_STRING,4,L"종료");
 SetForegroundWindow(hostWindow);
 UINT action=TrackPopupMenu(menu,TPM_RETURNCMD|TPM_RIGHTBUTTON,cursor.x,cursor.y,0,hostWindow,NULL);
 DestroyMenu(menu);PostMessageW(hostWindow,WM_NULL,0,0);
 if(action==1)openChat();
 if(action==2){onTop=!onTop;if(browserWindow && IsWindow(browserWindow))SetWindowPos(browserWindow,onTop?HWND_TOPMOST:HWND_NOTOPMOST,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE);}
 if(action==3){quietHidden=TRUE;if(browserWindow && IsWindow(browserWindow))ShowWindow(browserWindow,SW_HIDE);}
 if(action==4)DestroyWindow(hostWindow);
}

static LRESULT CALLBACK windowProc(HWND window,UINT msg,WPARAM wp,LPARAM lp){
 if(taskbarCreated && msg==taskbarCreated){addTray();return 0;}
 switch(msg){
  case WM_APP+1:openChat();return 0;
  case WM_APP+2:
   if(lp==WM_LBUTTONUP || lp==WM_LBUTTONDBLCLK)openChat();
   if(lp==WM_RBUTTONUP || lp==WM_CONTEXTMENU)trayMenu();return 0;
  case WM_TIMER:
   if(browserWindow && !IsWindow(browserWindow))browserWindow=NULL;
   if(!browserWindow && launchPending){EnumWindows(findWindow,0);if(GetTickCount64()-launchedAt>45000)launchPending=FALSE;}
   if(browserWindow && IsIconic(browserWindow)){quietHidden=TRUE;ShowWindow(browserWindow,SW_HIDE);}
   return 0;
  case WM_CLOSE:DestroyWindow(window);return 0;
  case WM_DESTROY:
   KillTimer(window,1);Shell_NotifyIconW(NIM_DELETE,&tray);
   if(browserWindow && IsWindow(browserWindow))PostMessageW(browserWindow,WM_CLOSE,0,0);
   PostQuitMessage(0);return 0;
 }
 return DefWindowProcW(window,msg,wp,lp);
}

int WINAPI WinMain(HINSTANCE instance,HINSTANCE previous,LPSTR cmd,int show){
 (void)previous;(void)cmd;(void)show;
 HANDLE mutex=CreateMutexW(NULL,FALSE,L"Local\\OfficeChat.TrayHost.v1");
 if(!mutex)return 1;
 if(GetLastError()==ERROR_ALREADY_EXISTS){HWND existing=FindWindowW(CLASS_NAME,NULL);if(existing)PostMessageW(existing,WM_APP+1,0,0);CloseHandle(mutex);return 0;}
 if(!locateBrowser()){MessageBoxW(NULL,L"이 앱은 Microsoft Edge가 필요합니다. Edge를 설치한 뒤 다시 실행해 주세요.",L"대화",MB_OK|MB_ICONINFORMATION);CloseHandle(mutex);return 1;}
 wchar_t local[MAX_PATH];DWORD n=GetEnvironmentVariableW(L"LOCALAPPDATA",local,MAX_PATH);
 if(!n || n>=MAX_PATH-32){MessageBoxW(NULL,L"앱 설정 폴더를 만들 수 없습니다.",L"대화",MB_OK);CloseHandle(mutex);return 1;}
 swprintf(profilePath,MAX_PATH,L"%ls\\OfficeChat",local);CreateDirectoryW(profilePath,NULL);
 swprintf(profilePath,MAX_PATH,L"%ls\\OfficeChat\\Profile",local);CreateDirectoryW(profilePath,NULL);
 appIcon=(HICON)LoadImageW(instance,MAKEINTRESOURCEW(1),IMAGE_ICON,32,32,LR_DEFAULTCOLOR);
 if(!appIcon)appIcon=LoadIconW(NULL,IDI_APPLICATION);
 WNDCLASSW wc={0};wc.lpfnWndProc=windowProc;wc.hInstance=instance;wc.lpszClassName=CLASS_NAME;wc.hIcon=appIcon;
 if(!RegisterClassW(&wc)){CloseHandle(mutex);return 1;}
 hostWindow=CreateWindowExW(WS_EX_TOOLWINDOW,CLASS_NAME,L"대화",WS_POPUP,0,0,0,0,NULL,NULL,instance,NULL);
 if(!hostWindow){CloseHandle(mutex);return 1;}
 tray.cbSize=sizeof(tray);tray.hWnd=hostWindow;tray.uID=1;tray.uFlags=NIF_ICON|NIF_MESSAGE|NIF_TIP;tray.uCallbackMessage=WM_APP+2;tray.hIcon=appIcon;wcscpy(tray.szTip,L"대화");
 taskbarCreated=RegisterWindowMessageW(L"TaskbarCreated");addTray();SetTimer(hostWindow,1,300,NULL);openChat();
 MSG msg;while(GetMessageW(&msg,NULL,0,0)>0){TranslateMessage(&msg);DispatchMessageW(&msg);}
 CloseHandle(mutex);return 0;
}
