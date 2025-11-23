IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 

IF !USED("PURCHASE")
	SELECT 0
	USE PURCHASE
ENDI 

Local oForm
oForm = CREATEOBJECT("TopForm1")
oForm.show()
_screen.Visible = .F. && Hide Screen

SET CONFIRM ON 
SET EXAC ON
prn=0
sl=0
pg=0
dw=chr(27)+chr(87)+chr(1)
dwc=chr(27)+chr(87)+chr(0)
dh=chr(27)+chr(119)+chr(1)
dhc=chr(27)+chr(119)+chr(128)
ep=chr(27)+chr(69)
epc=chr(27)+chr(70)
ds=chr(27)+chr(71)
dsc=chr(27)+chr(72)
cp=chr(15)
cpc=chr(18)
lqc=chr(27)+chr(120)+chr(0)
lq=chr(27)+chr(120)+chr(1)
WBOX=0
TAGENT=SPAC(30)
TINVNO=0
SELE PURCHASE
SET ORDER TO DATE
GO BOTT
TDT=DATE()
FDT=DATE()
defi wind MYPRN4 from 8,20 to 14,59 shad colo w+/r+,w+/n+ NONE FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
acti wind MYPRN4
@ 0,0 say padc("PURCHASE REPORT",39) COLO w+/n+
@ 2,1 SAY "FROM :" GET FDT
@ 2,21 SAY "TO :" GET TDT
@ 4,6 GET prn PICTURE "@*hT \<Screen;\<Printer;\<Exit" 
read
if last()=27 or prn=3
	rele wind MYPRN4
	IF USED("PARTY")
		SELECT PARTY
		USE
	ENDI 
	IF USED("PURCHASE")
		SELECT PURCHASE
		USE
	ENDI 
	RETU
endif
set curs off
set cons off
do case
	case prn = 1
		set safe off
		set alte to out.txt
		set alte on
		set safe on
		defi wind crea from 8,25 to 13,55 doub shad colo sche 10 FONT 'Consolas',15 STYLE "B" 
		acti wind crea
		@ 1,8 say "Creating Report"
		@ 2,8 say "Please Wait ..." colo W*/w+
	case prn = 2
		defi wind crea from 8,25 to 13,55 doub shad colo sche 10 FONT 'Consolas',15 STYLE "B" 
		acti wind crea
		@ 1,8 say "Printing Report"
		@ 2,8 say "Please Wait ..." colo W*/w+
		set cons off
    	*set prin on
 	case prn = 3
   		set proc to
   		retu
	endc

stot=0
if prn=1
	store '' to cp,cpc,ep,epc,DW,DWC,LQ,LQC,dh,dhc,DS,DSC
else
	??chr(27)+chr(67)+chr(0)+chr(12)
endif
DO HED

TQTY=0
tot=0
TAMT=0
SET SAFE OFF
SELECT TAGENT AS AGENT,FDT AS FDT,TDT AS TDT,*,AMOUNT AS NETAMT FROM PURCHASE WHERE DATE>=FDT AND DATE<=TDT INTO TABLE WASTE
SELE WASTE
sele WASTE
go top
scan 
	?PADR(dtoc(date),12)+" "+padl(invno,5)+' '+PADR(allt(PNAME)+"-"+ALLTRIM(CITY),35)+' '+str(QTY,6,2)+' '+str(NETamt,10,2)
	IF !EMPTY(VAL0)
		?SPACE(12)+"TAX 0 % "+" "+STR(VAL0,10,2)+" "+STR(CTAX0,8,2)+" "+STR(STAX0,8,2)
	ENDIF 
	IF !EMPTY(VAL5)
		?SPACE(12)+"TAX 5 % "+" "+STR(VAL5,10,2)+" "+STR(CTAX5,8,2)+" "+STR(STAX5,8,2)
	ENDIF 
	IF !EMPTY(VAL12)
		?SPACE(12)+"TAX 12 %"+" "+STR(VAL12,10,2)+" "+STR(CTAX12,8,2)+" "+STR(STAX12,8,2)
	ENDIF 
	IF !EMPTY(VAL18)
		?SPACE(12)+"TAX 18 %"+" "+STR(VAL18,10,2)+" "+STR(CTAX18,8,2)+" "+STR(STAX18,8,2)
	ENDIF 
	IF !EMPTY(VAL28)
		?SPACE(12)+"TAX 28 %"+" "+STR(VAL28,10,2)+" "+STR(CTAX28,8,2)+" "+STR(STAX28,8,2)
	ENDIF 

	tot=tot+NETamt
	TQTY=TQTY+QTY
	sl=sl+1
ends
?repl("-",72)
?spac(50)++str(tQTY,6,2)+" "+str(tot,12,2)
?repl("=",72)

if prn=2
*	eject
endif

SELE WASTE
USE

rele wind crea
set curs on
set cons on
if prn  = 1
	set alte off
	set alte to
	modi file out.txt  IN WINDOW  Form1 NOEDIT 
else
	set print off
endi
set cons off
set prin off
set cons on
if prn=2
	*!VB6\VFP98\VFP6.EXE VFPPRG1
	REPORT FORM AGENTREP.frx  NOCONSOLE PREVIEW IN WINDOW Form1
endi

RELEASE WINDOW MYPRN4
IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 

RETU

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Purchase Report"
FontName = 'Consolas'
FontSize = 15
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC

ENDDEFINE








proc hed
pg=pg+1
?PADC("ENTRY REPORT",50)
*?padl("Page No :"+str(pg,5),50)
*?"NO :"+ALLT(STR(SALE.INVNO,7))
?"  DATE  :"+DTOC(FDT)+" "+ " TO :" +DTOC(TDT)
?repl("-",72)
?PADC("DATE",8)+"  "+PADR("INVNO",8)+"  "+PADR("PARTY NAME",28)+"  "+PADC("QTY",8)+"  "+PADC("AMOUNT",12)
?repl("-",72)
retu




proc pgbrk
sl=0
?repl("-",50)
if prn=2
	eject
endi
do hed
retu



PROCEDURE CHKAGENT
SELECT PARTY 
SET FILTER TO 
sele agent from party into curs tag grou by ageNt
sele tag
IF !EMPTY(TAGENT)
	SELECT TAG
	SET FILTER TO 
	SET FILTER TO ALLTRIM(AGENT)=ALLTRIM(TAGENT)
ENDIF 
defi popu finda from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Agent",30) prom fiel padr(agent,35) FONT 'Consolas',15 STYLE "B" 
on sele popu finda do selag
acti popu finda REST 
retu



proc selag
Tagent=tag.agent
show gets
deac popu finda
RETURN
