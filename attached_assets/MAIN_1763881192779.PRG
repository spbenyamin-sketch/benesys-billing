CLEA ALL
CLOSE ALL
SET TALK OFF
SET HELP OFF 
SET RESOURCE OFF 
SET REPROCESS TO AUTOMATIC  
SET REFRESH TO 1
SET CPDIALOG OFF 
SET ESCAPE OFF 
SET AUTOSAVE ON
SET SYSMENU TO DEFAULT 
SET SYSMENU ON 
set mouse off
SET TALK OFF
SET CENT ON
SET DELE ON
SET CONF ON
SET REFR TO 1
SET EXAC ON
SET DATE TO ITALI

RELEASE WINDOWS standard
SET SYSMENU OFF 
SET ENGINEBEHAVIOR 70

one_level_up = SYS(5) + SYS(2003)
SET CENT ON
SET DATE ITALI
EXFACT=1
CLOSE TABLE
=CAPSLOCK(.T.)
PUBLIC OHEIGHT,OWIDTH
oheight=sysmetric(1)
owidth=sysmetric(2)
if sysmetric(1)<1024 OR sysmetric(1)>1024
	*do changeres with 1024,768
endif

WITH _SCREEN
     .windowstate = 2
     .width = INT(1024 * exfact)
     .height = INT(768 * exfact)
     .closable = .T.
     .caption = "STORE MANAGEMENT    [ A PRODUCT OF BEN SYSTEM SOFTWARE - MADURAI.2 PH:99768 85428"
     .icon = "star.ico"
     .BACKCOLOR=RGB(250,150,150)
     .MINBUTTON=.T.
     .MAXBUTTON=.F.
	 .Fontname='Consolas'
     .Fontsize=15
     .fontbold=.t. 
     .Themes=.f. 
ENDWITH



publ PARK,parkinvno,parkdate,PARKAMT,DSALE,PARKINV1,PARKINV2,TCNO,TD,PARKTDIS,COMPREC,XP,XTBILLX,TITSEL,LKEY
PUBLIC YRNAME,FINALDATE,FINALDATE1
YRNAME=""
FINALDATE={}
FINALDATE1={}
LKEY=.F.
TITSEL=.F.
XTBILLX=""
XP=.F.
COMPREC=0
DSALE=0
PARK=.F.
parkinvno=0
PARKINV1=0
PARKINV2=0
PARTAMT=0

parkdate=date()
DIMENSION DB(20)
*publ dime db(20)
PUBL XGIVEN,XRETURN,XAMT
XGIVEN=0.00
XRETURN=0.00
XAMT=0.00
LOCK=.T.

PUBL MACHINEID
MACHINEID=ALLT(SUBS(SYS(0),1, AT(" ",SYS(0) )))
publ ANAM,BNAM,cnam,cdat,pic,cadd,cadd1,CADD2,CADD3,CTIN,CCST,cphone1,cphone2,cmobile,cmess,supp,tcom,TCRCOM,TRCOM1,PIC1
PUBL XNAM,XADD1,XADD2,XADD3,TCOM1,CTNGST1,CCST1,TCOM2,COUNTER,CTHERMAL
PUBL DW,DWC,DH,DHC,EP,EPC,DS,DSC,CP,CPC,LQ,LQC,CP12,CP12C,UND,UNDC
PUBL XTOT1,XTOT2,CGST,cmess1,TAGCODE,SUPP1
TAGCODE=0
SUPP1=.F.
XTOT1=0
XTOT2=0
CTHERMAL=.F.
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
cp12=chr(27)+chr(77)
cp12c=chr(27)+chr(78)
und=chr(27)+"-1"
undc=chr(27)+"-0"

TCOM=""
TCRCOM=""
pic="99,99,999.99"
pic1="9999999"

publ tcash,tbill,tcashier,tbiller,pw
pw=spac(5)
tcash=0
tbill=0
tcashier=spac(25)
tbiller=spac(25)
supp=.T.


PUBL CDAT,CNAM,BOPEN,XTB
XTB=""
BOPEN=.F.

Local oForm
oForm = CREATEOBJECT("TopForm")
oForm.show()

_screen.Visible = .F. && Hide Screen

ON KEY LABEL CTRL+F DO FIND.MPR 

*DEFI WIND MAIN FROM 0,0 TO 30,90 none colo W+/W+ FONT 'Consolas',15 STYLE "B"   IN WINDOW TopLevelForm 
*ACTI WIND MAIN 
USER=.T.
OPT=.T.
@ 0,85 SAY DTOC(DATE()) FONT 'Consolas',16 STYLE "B"   
@ 30,40 SAY "Press F4 or Exit To Quit" FONT 'Consolas',16 STYLE "B"   
*ON KEY LABEL F6 DO USER
ON KEY LABEL CTRL+L DO YYY

******* FOR TWO BILLING SCREEN CHECKING 
ON ERROR DO ERRHAND WITH ERROR()
SET EXCLUSIVE ON
sele 6
use config.fin
******
ON ERROR 


ON KEY LABEL ALT+E DO DSUPP  
if passxn()
	DO REINX
	DO SELYEAR
	if last()=27
	*	canc
	endi
ELSE
	QUIT
endi

ON ERROR DO errHandler WITH ;
   ERROR( ), MESSAGE( ), MESSAGE(1), PROGRAM( ), LINENO( )

*ON ERROR DO ERRHAND1 WITH ERROR()
ON KEY LABEL F4 DO RELFORM
*COLO w+/w+,b+/w+,w+/w+,,rb/rb+,w+/gb+ 

IF 1=2
DEFINE menu mainpop colo N+/N+,W+/G+,n+/n+,rb+/w+,n+/n+,W+/N+,W+/N+  FONT "CONSOLAS",13  IN WINDOW TopLevelForm 
DEFINE pad  a OF mainpop PROMPT '\<Billing     ' AT 1,1
DEFINE pad  b OF mainpop PROMPT '\<Transaction' AT 1,15
DEFINE pad  c OF mainpop PROMPT '\<Reports    ' AT 1,34 SKIP FOR SUPP=.T.
DEFINE pad  d OF mainpop PROMPT '\<Tools      ' AT 1,50
DEFINE pad  e OF mainpop PROMPT '\<Exit       ' AT 1,65 key alt+x,''

on  pad a of mainpop acti popup MAINP
on  pad b of mainpop acti popu trans
on  pad c of mainpop acti popup repo
on  pad d of mainpop acti popup tool
on  SELE pad e of mainpop do ext
ENDIF 

DEFI POPU MAINP FROM 1,3 FONT 'Consolas',12 STYLE "B"  IN WINDOW TopLevelForm 
defi bar 1 OF MAINP PROMPT '\<1.BILLING' 
defi bar 2 OF MAINP PROMPT '\<2.BILL COPY'
defi bar 3 OF MAINP PROMPT '\-'
defi bar 4 OF MAINP PROMPT '\<3.SALES REPORT' SKIP FOR SUPP=.T.
defi bar 5 OF MAINP PROMPT '\<4.SALES ITEM WISE' SKIP FOR SUPP=.T.
defi bar 6 OF MAINP PROMPT '\<5.SALES TOTAL' SKIP FOR SUPP=.T.
defi bar 7 OF MAINP PROMPT '\<6.ITEM MASTER' SKIP FOR SUPP=.T.
defi bar 8 OF MAINP PROMPT '\<7.PARTY MASTER' SKIP FOR SUPP=.T.
defi bar 9 OF MAINP PROMPT '\<8.PURCHASE ENTRY' SKIP FOR SUPP=.T.
defi bar 10 OF MAINP PROMPT '\<9.PAYMENT ENTRY' SKIP FOR SUPP=.T.
defi bar 11 OF MAINP PROMPT '\<A.OUTSTANDING REPORT' SKIP FOR SUPP=.T.
defi bar 12 OF MAINP PROMPT '\-'
defi bar 13 OF MAINP PROMPT '\B.CASH BOOK ENTRY' SKIP FOR SUPP=.T.
defi bar 14 OF MAINP PROMPT '\C.CASH BOOK ' SKIP FOR SUPP=.T.
defi bar 15 OF MAINP PROMPT '\-'
defi bar 16 OF MAINP PROMPT '\<D.PURCHASE REPORT' SKIP FOR SUPP=.T.
defi bar 17 OF MAINP PROMPT '\<E.PAYMENT REPORT' SKIP FOR SUPP=.T.
defi bar 18 OF MAINP PROMPT '\<F.PARTY LEDGER REPORT' SKIP FOR SUPP=.T.
defi bar 19 OF MAINP PROMPT '\-'
defi bar 20 OF MAINP PROMPT '\<G.STOCK INWARD' SKIP FOR SUPP=.T.
defi bar 21 OF MAINP PROMPT '\<H.STOCK INWARD REPORT' SKIP FOR SUPP=.T.
defi bar 22 OF MAINP PROMPT '\<I.STOCK REPORT' SKIP FOR SUPP=.T.
defi bar 23 OF MAINP PROMPT '\<J.STOCK BARCODE/EXPIRE' SKIP FOR SUPP=.T.
defi bar 24 OF MAINP PROMPT '\<K.STOCK BY DATE WISE' SKIP FOR SUPP=.T.
defi bar 25 OF MAINP PROMPT '\<L.STOCK VIEW' SKIP FOR SUPP=.T.
defi bar 26 OF MAINP PROMPT '\<M.STICKER PRINT ' SKIP FOR SUPP=.T.
defi bar 27 OF MAINP PROMPT '\O.MANUAL STOCK ' SKIP FOR SUPP=.T.
defi bar 28 OF MAINP PROMPT '\-'
defi bar 29 OF MAINP PROMPT '\<P.CUSTOMER REPORT' SKIP FOR SUPP=.T.
defi bar 30 OF MAINP PROMPT '\<Q.CUSTOMER PUR.HISTORY' SKIP FOR SUPP=.T.
defi bar 31 OF MAINP PROMPT '\<R.CHANGE YEAR'
defi bar 32 OF MAINP PROMPT '\<0.EXIT'




on sele bar 1 of mainp do SALEN
on sele bar 2 of mainp do INVREP WITH 1,0,"",0
on sele bar 4 of mainp do INVREP1
on sele bar 5 of mainp do ITEMREP1
on sele bar 6 of mainp do INVREP2
on sele bar 7 of mainp do SALMAS
on sele bar 8 of mainp do PARTY
on sele bar 9 of mainp do PURCHASE
on sele bar 10 of mainp do PAY
on sele bar 11 of mainp do OUTS
on sele bar 13 of mainp do CBENTRY
on sele bar 14 of mainp do CLEDGER
*on sele bar 15 of mainp do CBENTRY1
*on sele bar 16 of mainp do CLEDGER1
on sele bar 16 of mainp do PURREP
on sele bar 17 of mainp do COLREP
on sele bar 18 of mainp do PLEDGER
on sele bar 20 of mainp do PUR
on sele bar 21 of mainp do PURCREP
on sele bar 22 of mainp do STKREP
on sele bar 23 of mainp do STKREP1
on sele bar 24 of mainp do STKLED
on sele bar 25 of mainp do STKVIEW
on sele bar 26 of mainp do STICKER
on sele bar 27 of mainp do OP
on sele bar 29 of mainp do CUSTREP
on sele bar 30 of mainp do pointhis
on sele bar 31 of mainp do SELYEAR
on sele bar 32 of mainp do EXT

sd=.t.

do while sd=.t.
	acti popu mainp
endd


READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm as Form

ShowWindow = 2
Windowstate=2
Name = "TopLevelForm"
Caption = "STORE MANAGEMENT [ A PRODUCT OF BEN SYSTEM SOFTWARE - MADURAI.2 PH:99768 85428"
FontName = 'Consolas'
FontSize = 14
icon = "star.ico"
Backcolor = RGB(250,150,150)

PROCEDURE Destroy

CLEAR EVENTS

ENDPROC


ENDDEFINE

proc ext
sd=.f.
*DO CHANGERES WITH OHEIGHT,OWIDTH
*canc
QUIT
retu


PROC USER
IF USER
	USER=.F.
ELSE	
	USER=.T.
ENDI

proc XXX
if opt
	opt=.f.
else
	opt=.t.
endi
retu



PROCEDURE DSUPP
IF SUPP1=.F.
	SUPP1=.T.
	WAIT WINDOW "DELETE MODE ACTIVE" NOWAIT 
ELSE
	SUPP1=.F.
	WAIT WINDOW "DELETE MODE DE-ACTIVE" NOWAIT 
ENDIF 
RETURN 



PROCEDURE RELFORM
SET SYSMENU TO DEFAULT 
CLOSE DATABASES 
IF USED("COMP")
	SELECT COMP
	USE
ENDI 
SELECT 0
USE COMP
REPLACE POWER WITH .T.
IF USED("COMP")
	SELECT COMP
	USE
ENDI 
RELEASE ALL 
RELEASE WINDOW 
CLOSE ALL
QUIT
RETURN 

PROC ERRHAND
PARAMETERS ERRNO
IF ERRNO=1705
	MESSAGEBOX("BILLING ALREADY OPENED PRESS ALT+TAB..",0,"STORE")
	RELEASE ALL 
	RELEASE WINDOW 
   	CLOSE ALL
	QUIT
ENDI	
RETURN 	


PROC ERRHAND1
PARAMETERS ERRNO
SET SYSMENU TO DEFAULT 
IF ERRNO=1705
	MESSAGEBOX("BILLING ALREADY OPENED PRESS ALT+TAB..",0,"STORE")
	RELEASE ALL 
	RELEASE WINDOW 
   	CLOSE ALL
	QUIT
ENDI	
MESSAGEBOX("ERROR  "+ALLTRIM(STR(ERRNO)),0,"STORE")
CLOSE DATABASES 
RELEASE ALL 
RELEASE WINDOW 
CLOSE ALL
QUIT
RETURN 	


PROCEDURE errHandler
   PARAMETER merror, mess, mess1, mprog, mlineno
   CLEAR
	MESSAGEBOX(ALLTRIM(mess)+"   "+'In Line of code with ' +ALLTRIM(mess1)+"   "+'At Line number of ' + LTRIM(STR(mlineno))+"  "+'Program Name is ' +ALLTRIM(mprog),0,"Retail Pos Error Message")
	TERROR=""
	AA= 'Error number: ' + ALLTRIM(STR(merror))+" "
	BB=TERROR+ 'Error number: ' + 'Error message: ' + ALLT(mess)+" "
	CC= 'Line of code with error: ' + ALLT(mess1)+" "
	DD= 'Line number of error: ' + LTRIM(STR(mlineno))+" "
	EE= 'Program with error: ' + mprog 

	TERROR=ALLT(AA)+CHR(13)+ALLT(BB)+CHR(13)+ALLT(CC)+CHR(13)+ALLT(DD)+CHR(13)+ALLT(EE)
	IF USED("ERRORLOG")
		SELE errorlog
		USE 
	ENDIF
	IF !USED("ERRORLOG")
		SELE 0
		USE errorlog
	ENDIF
	SELE ERRORLOG
	APPE BLANK
	REPL DATE WITH DATE(),TIME WITH TIME()
	REPL ERROR WITH  TERROR
	IF USED("ERRORLOG")
		SELE errorlog
		USE 
	ENDIF
	IF USED("COMP")
		SELECT COMP
		USE
	ENDI 
	SELECT 0
	USE COMP
	REPLACE POWER WITH .T.
	IF USED("COMP")
		SELECT COMP
		USE
	ENDI 

	*RETURN 
	CLOSE ALL
	*CLEAR ALL
	*RELEASE WINDOWS 
	*QUIT
	MESSAGEBOX("PLEASE TAKE SCREEN SHOT & INFORM THE PROGRAMER",0,"Retail Pos Error Message")
	MESSAGEBOX(ALLTRIM(mess)+"   "+'In Line of code with ' +ALLTRIM(mess1)+"   "+'At Line number of ' + LTRIM(STR(mlineno))+"  "+'Program Name is ' +ALLTRIM(mprog),0,"Retail Pos Error Message")
	RELEASE ALL 
	QUIT
ENDPROC



proc YYY
SELECT LDATE
if BILLLOCK=.F.
	REPLACE BILLLOCK WITH .T.
	WAIT WINDOW "ENABLE" NOWAIT 
else
	REPLACE BILLLOCK WITH .F.
	WAIT WINDOW "DISABLE" NOWAIT 
endi
retu



PROCEDURE SELYEAR
IF USED("YEAR")
	SELE YEAR
	USE 
ENDIF 
IF !USED("YEAR")
	SELE 0
	USE YEAR 
ENDIF 
SELECT YEAR
SET ORDER TO SNO DESCENDING  
DEFI POPU YR FROM 4,35 TO 15,60 PROM FIEL NAME FONT 'Consolas',16 STYLE "B"  IN WINDOW TopLevelForm 
ON SELE POPU YR DO SELYEAR1
ACTI POPU YR
IF USED("YEAR")
	SELE YEAR
	USE 
ENDIF 
RETURN 

PROCEDURE SELYEAR1 
FINALDATE=YEAR.FDATE
FINALDATE1=YEAR.TDATE
YRNAME=YEAR.NAME
@0,0 SAY PADC(ALLTRIM(YRNAME)+" "+ALLTRIM(ANAM)+"    "+DTOC(DATE()),92) FONT 'Consolas',15 STYLE "B"
DEACTIVATE POPUP YR
RETURN 
