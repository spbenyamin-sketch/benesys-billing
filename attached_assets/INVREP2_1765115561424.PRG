IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 

IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 

IF !USED("MAINSALE")
	SELECT 0
	USE DATA\MAINSALE
ENDI 

IF !USED("SALE")
	SELECT 0
	USE DATA\SALE
ENDI 

Local oForm
oForm = CREATEOBJECT("TopForm1")
oForm.show()
_screen.Visible = .F. && Hide Screen

SET CONFIRM ON 
prn=0
sl=0
pg=0
TBILL1="ALL"
TRTYPE="NORMAL"
dw=chr(27)+chr(33)+chr(46)
dwc=chr(27)+CHR(33)+CHR(8)
dh=chr(27)+chr(119)+chr(1)
dhc=chr(27)+chr(119)+chr(128)
ep=chr(27)+chr(33)+chr(8)
epc=chr(27)+chr(70)
ds=chr(27)+chr(71)
dsc=chr(27)+chr(72)
cp=chr(27)+CHR(33)+CHR(11)
cpc=CHR(27)+CHR(33)+CHR(8)
lqc=chr(27)+chr(120)+chr(0)
lq=chr(27)+chr(120)+chr(1)
cp12=chr(27)+chr(77)
cp12c=chr(27)+chr(78)
UND=CHR(27)+"-1"
UNDC=CHR(27)+"-0"
SELE SALE
TDT=DATE()
FDT=DATE()


defi wind MYPRN2 from 8,21 to 14,60 shad colo w+/r+,w+/n+ none FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
acti wind MYPRN2
@ 0,0 say padc("ENTRY REPORT TOTAL ",45) colo w+/n+
@ 2,1 SAY "FROM :" GET FDT
@ 2,21 SAY "TO :" GET TDT 
@ 4,2 GET TBILL1 PICT "@MK ALL,GST,TAX,EST" VALI CHKINO()
@ 4,12 GET prn PICTURE "@*hT \<Screen;\<Printer;\<Exit" 
read
if last()=27 or prn=3
	rele wind MYPRN2
	SELE SALE
	SET FILT TO
	IF USED("PARTY")
		SELECT PARTY
		USE
	ENDI 
	IF USED("MAINSALE")
		SELECT MAINSALE
		USE
	ENDI 
	IF USED("SALE")
		SELECT SALE
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
		SELE SALE
		SET FILT TO
   		set proc to
   		retu
	endc

stot=0

if prn=1
	store '' to cp,cpc,ep,epc,DW,DWC,LQ,LQC,dh,dhc,DS,DSC
else
	??chr(27)+chr(67)+chr(0)+chr(12)
endif
TAMT=0

SET SAFE OFF	
IF TBILL1#"ALL"
	IF TBILL1="GST"
		TCOMPANY=1
	ENDIF 
	IF TBILL1="TAX"
		TCOMPANY=2
	ENDIF 
	IF TBILL1="EST"
		TCOMPANY=3
	ENDIF 
	SELECT FCODE,FDT AS FDT,TDT AS TDT,DATE,IIF(TYPE=1,GTOT,000000.00) AS CHTOT,IIF(TYPE=2,GTOT,000000.00) AS CRTOT,GTOT FROM MAINSALE WHERE COMPANY=TCOMPANY AND DATE>=FDT AND DATE<=TDT INTO CURSOR SS ORDER BY DATE 
	SELECT FCODE,FDT,TDT,DATE,SUM(CHTOT) AS CHTOT,SUM(CRTOT) AS CRTOT,SUM(GTOT) AS GTOT FROM SS GROUP BY DATE INTO TABLE SALTOT ORDER BY DATE
ELSE
	SELECT FCODE,FDT AS FDT,TDT AS TDT,DATE,IIF(TYPE=1,GTOT,000000.00) AS CHTOT,IIF(TYPE=2,GTOT,000000.00) AS CRTOT,GTOT FROM MAINSALE WHERE DATE>=FDT AND DATE<=TDT INTO CURSOR SS ORDER BY DATE 
	SELECT FCODE,FDT,TDT,DATE,SUM(CHTOT) AS CHTOT,SUM(CRTOT) AS CRTOT,SUM(GTOT) AS GTOT FROM SS GROUP BY DATE,FCODE INTO TABLE SALTOT ORDER BY DATE
ENDIF

SELECT SALTOT
DO HED
TNETAMT=0
TCHAMT=0
TCRAMT=0
SELE SALTOT
?ALLTRIM(TBILL1)
SCAN 
	?DTOC(DATE)+" "+STR(CHTOT,10,2)+" "+STR(CRTOT,10,2)+" "+STR(GTOT,10,2)
	TCHAMT=TCHAMT+CHTOT
	TCRAMT=TCRAMT+CRTOT
	TNETAMT=TNETAMT+GTOT
ENDSCAN
?repl("-",50)
?PADC("NET TOTAL",10)+" "+STR(TCHAMT,10,2)+" "+STR(TCRAMT,10,2)+" "+STR(TNETAMT,10,2)
?repl("-",50)

SELE SALTOT
USE
IF PRN=2
	REPORT FORM invrep2.frx  NOCONSOLE PREVIEW IN WINDOW Form1 
ENDI


rele wind crea
set curs on
set cons on
if prn  = 1
	set alte off
	set alte to
	modi file out.txt  IN WINDOW Form1 NOEDIT  
else
	set print off
endi
set cons off
set prin off
set cons on
RELEASE WINDOW MYPRN2
SELE SALE
SET FILT TO
IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 

RETU

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Sales Report"
FontName = 'Consolas'
FontSize = 17
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC

ENDDEFINE








proc hed
?PADC("INVOICE REPORT",50)
?repl("-",50)
?PADC("DATE",10)+" "+PADC("CASH",12)+" "+PADC("CARD",12)+" "+PADR("NET.AMT",12)
?repl("-",50)
retu





proc pgbrk
sl=0
?repl("-",42)
if prn=2
	eject
endi
do hed
retu


PROC CHKINO
IF TBILL1="GST"
	TCOMPANY=1
ENDIF 
IF TBILL1="TAX"
	TCOMPANY=2
ENDIF 
IF TBILL1="EST"
	TCOMPANY=3
ENDIF 
IF !USED("MAINSALE")
	SELECT 0
	USE DATA\MAINSALE
ENDI 
SELE MAINSALE
SET ORDER TO INVNO
IF TBILL1="ALL"
	SET FILT TO 
ELSE
	SET FILT TO COMPANY=TCOMPANY
ENDIF 
SHOW GETS
RETU 