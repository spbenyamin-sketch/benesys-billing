IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 

IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 

IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 


IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 

IF !USED("MAINSALE")
	SELECT 0
	USE DATA\MAINSALE
ENDI 

IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 

IF !USED("PAYMENT")
	SELECT 0
	USE PAYMENT
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
TINVNO=0
TAGENT=SPAC(30)
TAGE="ALL"
FDATE=DATE()

defi wind PAYWIND from 8,20 to 14,64 shad colo w+/r+,w+/n+ NONE FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
acti wind PAYWIND
@ 0,0 say padc("OUTSTANDING REPORT",43) colo w+/n+
@ 2,10 SAY "DATE :" GET FDATE 
*@ 4,1 SAY "AGENT :" GET TAGE PICT "@M ALL,AGN"
*@ 4,14  GET TAGENT SIZE 1,25 VALI CHKAGENT() WHEN TAGE="AGN" PICT "@K"
@ 4,6 GET prn PICTURE "@*hT \<Screen;\<Printer;\<Exit" 
read
if last()=27 or prn=3
	rele wind PAYWIND
IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 
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
		set safe off
		set alte to out.txt
		set alte on
		set safe on
		defi wind crea from 8,25 to 13,55 doub shad colo sche 10 FONT 'Consolas',15 STYLE "B" 
		acti wind crea
		@ 1,8 say "Printing Report"
		@ 2,8 say "Please Wait ..." colo W*/w+
		set cons off
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
WAIT WINDOW "PROCESSING PLEASE WAIT...." NOWAIT 
TAMT=0
PUAMT=0
PYAMT=0
SET SAFE OFF
SELECT * FROM PURCHASE INTO CURSOR PPUR1
SELE * FROM PAYMENT INTO CURS PPAY
SELECT CUSTCODE AS PCODE,TAXVALUE,SALEVALUE,DATE,INVNO,GTOT AS NETAMT FROM MAINSALE INTO CURSOR PPUR

SELE PARTY
REPL ALL OUTAMT WITH 0,PURAMT WITH 0
GO TOP
SCAN
	XPCODE=PARTY.PCODE
	SELE PPUR1
	SUM AMOUNT TO CC FOR PCODE=XPCODE AND DATE<=FDATE
	SELE PPUR
	SUM NETAMT TO AA FOR PCODE=PARTY.PCODE AND DATE<=FDATE
	SELE PPAY
	SUM CREDIT TO BB FOR PCODE=XPCODE AND DATE<=FDATE
	SUM DEBIT TO BB1 FOR PCODE=XPCODE AND DATE<=FDATE
	SELE PARTY
	REPL PURAMT WITH OPDEBIT+CC+BB+AA,OUTAMT WITH OPCREDIT+BB1
ENDS

IF TAGE="ALL"
	SELE PARTY
	SET FILT TO
ELSE
	SET FILT TO
	SET FILT TO ALLT(AGENT)=ALLT(TAGENT)
ENDI
SELE PARTY
SET ORDER TO PNAME
SCAN 
	?PADR(ALLT(PNAME)+"-"+ALLT(CITY),35)+" "+STR(PURAMT,10,2)+"  "+STR(OUTAMT,10,2)+"  "+STR(PURAMT-OUTAMT,10,2)
	TAMT=TAMT+(PURAMT-OUTAMT)
	PUAMT=PUAMT+PURAMT
	PYAMT=PYAMT+OUTAMT
ENDS
?REPL("-",70)
?SPAC(36)++STR(PUAMT,10,2)+"  "+STR(PYAMT,10,2)+"  "+STR(TAMT,10,2)
?REPL("-",70)
IF ALLTRIM(TAGE)="ALL"
	XAGENT="ALL PARTY"
	SELE *,XAGENT AS XAGENT FROM PARTY INTO TABL TEMP\POUTS ORDE BY PNAME 
ELSE
	XAGENT=TAGENT
	SELE *,XAGENT AS XAGENT FROM PARTY INTO TABL TEMP\POUTS ORDE BY PNAME WHER ALLT(AGENT)=ALLT(XAGENT)
ENDIF 

WAIT WINDOW "FINISHED...." NOWAIT 
SELE POUTS
USE

SELECT PPAY
USE

SELECT PPUR1
USE

SELE PARTY
SET FILT TO

IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 
IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 

IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 


rele wind crea
set curs on
set cons on
if prn  = 1
	set alte off
	set alte to
	modi file out.txt IN WINDOW  Form1 NOEDIT 
else
	set print off
endi
if prn=2
   	*!VB6\VFP98\VFP6.EXE VFPPRG10
	REPORT FORM OUTSREP.frx  NOCONSOLE PREVIEW IN WINDOW Form1
endi
	

set cons off
set prin off
set cons on
RELEASE WINDOW PAYWIND
IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
RETU


READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Outstandig Report"
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
IF TAGE="ALL"
	?PADC("OUTSTANDING REPORT FOR ALL PARTY AS ON "+DTOC(FDATE),70)
ELSE
	?PADC("OUTSTANDING REPORT FOR "+ALLT(TAGENT)+" AS ON "+DTOC(FDATE),70)
ENDI 
?padl("Page No :"+str(pg,5),70)
?repl("-",70)
?PADC("PARTY NAME",35)+" "+PADC("CREDIT",10)+"  "+PADC("DEBIT",10)+"  "+PADC("BALANCE",10)
?repl("-",70)
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
