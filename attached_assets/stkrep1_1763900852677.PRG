IF USED("PUR")
	SELECT PUR
	USE
ENDI 
IF USED("SALMAS")
	SELECT SALMAS
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 

IF !USED("PUR")
	SELECT 0
	USE PUR
ENDI 

IF !USED("SALMAS")
	SELECT 0
	USE SALMAS
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
TDT=DATE()
TTYPE="NORMAL"
PRN=1
defi wind myprn from 8,20 to 14,54 shad colo w+/r+,w+/n+ NONE FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
acti wind myprn
@ 0,0 say padc("Stock Report Brand Wise",39) colo W+/N+
@ 3,1 SAY "Date :" GET TDT SIZE 1,10 VALI CHKDT() 
@ 3,20 SAY "VIEW BY :" GET TTYPE PICT "@M NORMAL,EXPIRY"
@ 5,6 GET prn PICTURE "@*hT \<Screen;\<Printer;\<Exit" 
read
if last()=27 OR prn=3
	rele wind myprn
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
WAIT WINDOW "PROCESSING PLEASE WAIT...." NOWAIT 
SET SAFETY OFF 
IF TTYPE="NORMAL"
	SELECT EXPDATE,TDT AS DATE,SERIAL,NAME AS QUALITY,ITNAME AS NAME,COST,SUM(DQTY) AS DPUR,SUM(QTY) AS PUR,000000.00 AS SALES,00000000.00 AS STOCK,00000000.00 AS STKVAL FROM PUR GROUP BY SERIAL INTO TABLE TEMP\WST ORDER BY ITNAME,BRANDNAME,NAME
ELSE
	SELECT EXPDATE,TDT AS DATE,SERIAL,NAME AS QUALITY,ITNAME AS NAME,COST,SUM(DQTY) AS DPUR,SUM(QTY) AS PUR,000000.00 AS SALES,00000000.00 AS STOCK,00000000.00 AS STKVAL FROM PUR GROUP BY SERIAL INTO TABLE TEMP\WST ORDER BY EXPDATE,ITNAME,BRANDNAME,NAME WHERE !EMPTY(EXPDATE)
ENDIF 

SELECT VAL(BARID) AS SERIAL,IIF(TYPE="P",SUM(QTY),SUM(VAL(SIZE)*QTY)) AS SALES FROM SALE GROUP BY BARID INTO CURSOR WST1 WHERE LEN(ALLTRIM(BARID))=7
SELECT WST
SCAN
	SELECT WST1
	SUM SALES FOR SERIAL=WST.SERIAL TO TS
	SELECT WST
	REPLACE SALES WITH TS,STOCK WITH PUR-SALES-DPUR 
	REPLACE STKVAL WITH STOCK*COST
	SELECT WST
ENDSCAN 
SELECT WST
WAIT WINDOW "STOCK UPDATING" NOWAIT 
SCAN
	SELECT PUR
	SET ORDER TO SERIAL
	SEEK WST.SERIAL
	IF FOUND()
		SELECT PUR
		REPLACE SALEQTY WITH WST.SALES
		REPLACE STOCKQTY WITH WST.PUR-WST.SALES-WST.DPUR
		IF PUR.PURNO=-1 AND STOCKQTY<1
			REPLACE QTY WITH ABS(SALEQTY)
			REPLACE STOCKQTY WITH QTY-SALEQTY-DQTY
		ENDIF 
	ENDIF 
	SELECT PUR
ENDS
WAIT WINDOW "STOCK UPDATING FINISHED" NOWAIT 

Sele WST
DELETE FOR PUR=0 AND SALES=0 
DELETE FOR STOCK=0
SUM PUR TO TP
SUM SALES TO TSAL
SUM PUR-SALES TO TST
SUM DPUR TO TDST
SUM STOCK*COST TO TSTV
go top
scan 
	?ALLTRIM(STR(SERIAL))+" "+PADR(allt(QUALITY),35)+' '+str(PUR,8,2)+' '+str(SALES,8,2)+' '+str(DPUR,8,2)+' '+str(STOCK,8,2)+' '+str(STKVAL,10,2)+'     '+DTOC(EXPDATE)
ends
?repl("-",100)
?SPACE(37)+' '+str(TP,10,2)+' '+str(TSAL,10,2)+' '+str(TDST,10,2)+' '+str(TST,10,2)+' '+str(TSTV,10,2)
?repl("-",100)
SELE WST 
USE
WAIT WINDOW "FINISHED...." NOWAIT 

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
	*!VB6\VFP98\VFP6.EXE VFPPRG4
	REPORT FORM STOCKREP1.frx  NOCONSOLE PREVIEW IN WINDOW Form1
endi

RELEASE WINDOW MYPRN
IF USED("PUR")
	SELECT PUR
	USE
ENDI 
IF USED("SALMAS")
	SELECT SALMAS
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 

RETURN 


READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Stock Report"
FontName = 'Consolas'
FontSize = 17
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC
ENDDEFINE

PROC CHKDT
RETU



proc hed
?"STOCK REPORT AS ON DATE  :"+DTOC(TDT)
?repl("-",100)
?PADC("BARCODE",7)+"  "+PADC("BRAND NAME",33)+"  "+PADC("PUR",8)+"  "+PADC("SALES",8)+"  "+PADC("EXP/DAM",8)+"  "+PADC("STOCK-QTY",10)+"  "+PADC("STOCK-VALUE",12)+"  "+PADC("EXPIRE DATE",12)
?repl("-",100)
retu
