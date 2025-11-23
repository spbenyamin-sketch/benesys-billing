IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 

IF !USED("PURCHASE")
	SELECT 0
	USE PURCHASE
ENDI 

IF USED("PUR")
	SELECT PUR
	USE
ENDI 

IF !USED("PUR")
	SELECT 0
	USE PUR
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
TPURNO=0
SELE PURCHASE
SET ORDER TO DATE
GO BOTT
defi wind MYPRN4 from 8,20 to 14,59 shad colo w+/r+,w+/n+ NONE FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
acti wind MYPRN4
@ 0,0 say padc("INWARD REPORT",39) COLO w+/n+
@ 2,8 SAY "ENTRY NO :" GET TPURNO SIZE 1,10 vali chkpno()
@ 4,1 GET prn PICTURE "@*hT \<Screen;\<Printer;\<Exit" 
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
	IF USED("PUR")
		SELECT PUR
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
SELECT PUR
DELETE FOR SERIAL=0
SELECT *,000000 AS NOQ FROM PUR WHERE PURNO=TPURNO INTO CURSOR XPUR
SELECT XPUR
SELECT PURCHASE
SET ORDER TO PURNO
SEEK XPUR.PURNO
?PADR(dtoc(date),12)+" "+padl(invno,5)+' '+PADR(allt(PNAME)+"-"+ALLTRIM(CITY),35)+' '+str(QTY,6,2)+' '+str(Camount,10,2)
?REPLICATE("-",72)
?
?
?repl("-",72)
?PADR("ITEM NAME",20)+" "+PADR("BRANDNAME",25)+" "+PADR("NAME",25)+" "+"  QTY  "+" "+"  COST  "+" "+"  RATE  "
?repl("-",72)
SELECT XPUR
go top
scan 
	?PADR(ALLTRIM(ITNAME),20)+" "+PADR(ALLTRIM(BRANDname),25)+" "+PADR(ALLTRIM(name),25)+" "+STR(QTY,7,2)+" "+STR(COST,7,2)+" "+STR(RRATE,8,2)
	?ALLTRIM(ALLTRIM(BARCODE)+SPACE(15)+ALLTRIM(STR(SERIAL)))
	tot=tot+(COST*qty)
	TQTY=TQTY+QTY
	sl=sl+1
ends
?repl("-",72)
?spac(50)++str(tQTY,6,2)+" "+str(tot,12,2)
?repl("-",72)

if prn=2
*	eject
endif


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
IF prn=4
	RELEASE WINDOW MYPRN4
	IF USED("BAR")
		SELECT BAR
		USE 
	ENDIF 
	SELECT *,000000 AS NOQ FROM PUR WHERE PURNO=TPURNO AND EMPTY(BARCODE) INTO CURSOR XPURX
	SELECT xpurX 
	COPY TO TEMP\BAR
	IF USED("BAR")
		SELECT BAR
		USE 
	ENDIF 

	IF !USED("BAR")
		SELECT 0
		USE TEMP\BAR
	ENDIF 
	BROW FIEL NAME :30,SERIAL :8,QTY :10,NOQ :5 NOAP FREE NOQ 

	SELECT BAR
	GO TOP
	SCAN FOR NOQ#0
		TNOQ=BAR.NOQ 
		TSERIAL=BAR.SERIAL 
		SET STEP ON 
		FOR IX=1 TO TNOQ
			IF USED("BARC")
				SELECT BARC
				USE 
			ENDIF 
			SELECT BAR
			COPY TO TEMP\BARC FOR SERIAL=TSERIAL
			IF USED("BARC")
				SELECT BARC
				USE 
			ENDIF 
			REPORT FORM STICKER.frx  NOCONSOLE TO PRINTER 
		ENDF 
		SELECT BAR
	ENDS
	IF USED("BAR")
		SELECT BAR
		USE 
	ENDIF 

ENDIF 
if prn=2
	*!VB6\VFP98\VFP6.EXE VFPPRG1
	*REPORT FORM AGENTREP.frx  NOCONSOLE PREVIEW IN WINDOW Form1
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
?PADC("INWARD REPORT",50)
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




PROCEDURE CHKPNO
IF EMPTY(TPURNO)
	RETURN 0
ENDIF 
IF !USED("PURCHASE")
	SELECT 0
	USE PURCHASE
ENDI 
SELECT PURCHASE
SET ORDER TO PURNO
SEEK TPURNO
IF FOUND()

ELSE
	WAIT WINDOW "PURCHASE ENTRY NOT GENRATED...." NOWAIT 
ENDIF 
SHOW GETS 
SELECT PUR
RETURN 


