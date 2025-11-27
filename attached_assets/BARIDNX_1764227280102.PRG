=CAPS(.T.)
CDAT='SKR'
CNT='NO '
Xttpurno=0

DEFI WIND XX FROM 3,20 TO 5,55 COLO (COLR.WINDOW)
ACTI WIND XX
@ 0,1 SAY "CONTINUE :" GET CNT PICT "@M NO,YES"
@ 0,16 SAY "PUR.NO :" GET XTTPURNO SIZE 1,8 WHEN ALLT(CNT)="YES" VALI CHKPURNO()
READ
RELE WIND XX
IF LAST()=27
	RETU
ENDI
	
DS=.F.

ON KEY LABEL F9 DO DELT
ON KEY LABEL F5 DO SHORTCUT
ON KEY LABEL F8 DO CHKDET
ON KEY LABEL F10 DO CHKDET1
ON KEY LABE CTRL+F8 DO DS
ON KEY LABE CTRL+S DO BARDISC
ON KEY LABE CTRL+O DO PRERATE


IF UPPER(ALLT(CNT))#'YES'
	CNT='NO'
ENDI

SELE PATTERN 
SET ORDE TO NAME

ON KEY LABE F6 DO PATT
ON KEY LABE CTRL+F6 DO FXDNO
PATT=.F.
FXDNO=.F.
*SET STEP ON
*acno='1'
SET SAFE OFF
WTAX=4
NTOT=0
NTAX=0
NQTY=0
QQQ=1
M.QUALITY=SPAC(25)
M.NAME=SPAC(40)
F8=.F.
F10=.F.

STORE 0 TO XR1,XR2,XR3,XR4,XR5,XR6,XR7,XR8,XR9,XR10,XR11,XR12

M.CLES='5'
TCLES=' '
TPRFT=0.00
TDIS=0.00
TRD=0.00
TDIS1=0.00
TRD1=0.00
TAG=0.00
ON KEY LABEL F7 DO DETAIL
ON KEY LABEL CTRL+D DO DISCLESS
NW=.T.
XSIZ=0
YSIZ=0
TTD=0
ttcode=spac(3)
TTACNO="1"
ttpartyid=spac(30)
ttpid=spac(20)
ttqual=spac(30)
ttpat=spac(20)
tdate=date()
tedate=date()
ttpcode=spac(4)
ttpurno=0

tdlat=1
TTDNO=SPAC(15)
m.tamt=0.00

sele salmas
set order to name
go top
set conf on
first=.t.
*store 0 to s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12
store 0 to r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12
*store 0 to ts1,ts2,ts3,ts4,ts5,ts6,ts7,ts8,ts9,ts10,ts11,ts12
store 0 to mrp1,mrp2,mrp3,mrp4,mrp5,mrp6,mrp7,mrp8,mrp9,mrp10,mrp11,mrp12

IF USED("TEMP")
	SELE TEMP
	USE
ENDI

IF ALLT(CNT)='NO'
	SELE 15 
	USE
	USE COMMON\TEMP
	COPY TO C:\TEMP
	COPY TO C:\TEP

	SELE TEMP
	USE

	SELE 15
	USE	
	USE C:\TEMP
ELSE
	SELE 15
	USE
	USE C:\TEMP
	SELE * FROM TEMP WHER PURNO=XTTPURNO AND EMPT(SERIAL) AND !EMPT(DATE) INTO TABL C:\TMP
	SELE * FROM TEMP WHER PURNO=XTTPURNO AND EMPT(SERIAL) AND !EMPT(DATE) INTO TABL C:\TMP1

	SELE TMP
	USE
	SELE TMP1
	USE

	SELE 15 
	USE
	USE COMMON\TEMP
	COPY TO C:\TEMP

	SELE TEMP
	USE

	SELE 15
	USE	
	USE C:\TEMP

ENDI

COUNT FOR EMPT(DATE) TO XX1
IF XX1=0
	APPE BLANK
ENDI

defi wind xx from 1,0 to 23,79 COLO W+/N+,W+/GB+
*COLOR (COLR.WINDOW) 
acti wind xx
@ 0,0 say padc("   PRODUCT ID GENERATION ENTRY   ",78) COLO R+
*do while last()#27
	SELE TEMP
	DEFI POPU TEMPX FROM 8,0 TO 11,77 PROM FIEL ;
	IIF(!EMPT(LEDGER),STR(RECN(),3)+'³'+CODE+' '+STR(SERIAL)+'³'+STR(COST,9,2)+'³'+STR(QTY,5)+'³'+PADR(ALLT(SIZE1)+'x'+ALLT(SIZE2),8)+'³'+STR(NCOST,5)+'³'+STR(RRATE,5)+"³"+ALLT(DNO1)+"-"+ALLT(quality)+' '+ALLT(SL), ;
	PADC("*-*-*-*-*-*-*-*-*-*-N-E-X-T--I-T-E-M-*-*-*-*-*-*-*-*-*-*-",76)) COLOR (COLR.POPUP)
	ON SELE POPU TEMPX DO SELTEMP
	KEYB "{ENTER}"
	KEYB "{END}"	
DO WHILE LAST()#27
	ACTI POPU TEMPX
ENDD
IF LAST()=27
	SELE TEMP
	SAVV=0
	CANL=0
	SELE PURCHASE
	NPQTY=PURCHASE.QTY
	IF NQTY#0
		IF NPQTY#NQTY
			DEFI WIND XX1 FROM 9,26 TO 13,60 COLO GR+/R+ NOSHAD
			ACTI WIND XX1
			@ 0,1 say PADC("Qty Not Tallied Check It..!",34)
			@ 2,1 say PADC("Purchase : "+ALLT(STR(NPQTY))+"   "+"Pur : "+ALLT(STR(NQTY)),34)
			READ
			RELE WIND XX1
		ENDI
	ENDI

DO WHILE .T.
	DEFI WIND SAVV FROM 9,20 TO 13,60 COLO sche 5
	ACTI WIND SAVV
	@ 1,4 GET SAVV PICT "@*ht -S a v e-"
	@ 1,19 get canl pict "@*HT -C a n c e l-"
	read
	IF SAVV=1 OR CANL=1
		EXIT
	ENDI	
ENDD	
	rele wind savv,xx
	if savv=1
		wait wind "Processing ......" nowa
	SET REPROCESS TO AUTOMATIC
	DO WHILE .T.
	IF FLOCK("PUR")
		*SELECT MAX(SERIAL) AS SERIAL FROM PUR INTO CURS MAXSL
		SELE PUR
		set orde to serial
		go bott
		tserial=serial
		Dele for purno=TTPURNO
		SELE TEMP
		GO TOP
		*******[GENERATING SERIAL]
			*TSERIAL=MAXSL.SERIAL
			SELE TEMP
			REPL ALL PCODE WITH PURCHASE.PCODE,MAC WITH TUSER
		    repl all date with purchase.creadate	
			GO TOP
			SCAN FOR !EMPT(QTY) AND EMPT(SERIAL)
				TSERIAL=TSERIAL+1			
				REPL SERIAL WITH TSERIAL
			ENDS
		*******
		SELE PUR
		Appe from C:\temp for !empt(qty)
		*******		
		SELE TEMP
		*CANC
		SCAN FOR (!EMPT(DETAIL1) OR !EMPT(DETAIL2)) AND !EMPT(QTY) 
			SELE PURDET
			DELE FOR SERIAL=TEMP.SERIAL 
			APPE BLANK
			REPL SERIAL WITH TEMP.SERIAL,DETAIL1 WITH TEMP.DETAIL1,DETAIL2 WITH TEMP.DETAIL2,;
			DETAIL3 WITH TEMP.DETAIL3,DETAIL4 WITH TEMP.DETAIL4
		ENDS
		*******
		UNLOCK IN PUR
		EXIT
		ENDI
	ENDD
		SELE INOUT
		DELE FOR PURNO=TTPURNO  and type=2
		SELE TEMP
		GO TOP
		DO INOUTRN
		wait wind "Records Saved..." nowa
	endi
	DEAC POPU TEMPX
ENDI

RETU


PROC SELTEMP
sav=0
IF EMPT(LEDGER)
	scat memv blank
	XSIZ=0
	YSIZ=0
	m.edate=date()
	m.dlat=tdlat
	m.date=tdate
	m.edate=tedate
	m.code=ttcode
	m.purno=ttpurno
	M.ACNO=TTACNO
	M.NAME=SPAC(40)
	M.SUPPLIER=SPAC(30)
	M.SUPPCITY=SPAC(30)
	m.pcode=ttpcode
	TTD=0	
	M.Pname=ttpid
	m.tax=wtax
	M.PRFT=TPRFT
	M.SLEEVE=SPAC(25)
	M.PATTERN=SPAC(25)
	M.SL=SPAC(8)
	M.DIS=TDIS
	M.CLES=TCLES
	
	M.RD=TRD
	M.DIS1=TDIS1
	M.RD1=TRD1
	M.AG=TAG
	if !empt(m.ttqual)
		m.quality=ttqual
	endi
	
	IF PATT
		if !empt(m.ttpat)
			m.pattern=ttpat
		endi
	ENDI
	IF FXDNO
		if !empt(m.TTDNO)
			M.DNO1=TTDNO
		endi
	ENDI

	IF CDAT="SKA" OR CDAT="SKR"
*		M.QUALITY=PADR(".",25)
	ELSE
		M.QUALITY=padr(ALLT(STR(RECN())),25)
	ENDI
*	M.SLEEVE=SPAC(15)
*	M.PATTERN=SPAC(15)
	M.NCOST=0.00
	GT=0
	m.unit="Pcs"
	M.SRATE=0.00
	M.WRATE=0.00
	M.RRATE=0.00
	M.LRDATE=DATE()
	
	NW=.T.
ELSE
	SCAT MEMV
	*M.QUALITY=SPAC(25)
	M.PNAME=TTPID
	*M.NAME=SPAC(40)
	NW=.F.
****[PIECE,RATE ASSIGN-SIZE WISE]****
	FOR IQ=1 TO 12
		QA1="R"+ALLT(STR(IQ))
		QA2="M.TR"+ALLT(STR(IQ))
		&QA1=&QA2
		*WAIT WIND STR(&QA2)
	ENDF
****	
ENDI
M.JC='J'
M.FV='V'
M.ZERO=.T.
IF CDAT="SKA"
	M.TAX=WTAX
ELSE
	M.TAX=PURCHASE.TAX
ENDI
	show gets
	@ 1,1 say "Pur. No  :" get m.purno vali chkparty() when first=.t.
	@ 1,24 say "Pur. Dt: " get m.edate WHEN .F. 
	*@ 1,46 GET M.ACNO SIZE 1,2 PICT "@m 1,2" VALID CHKACNO()
	@ 1,47 SAY "F7->DETAILS CTRL+D->DISC DETAILS"
	@ 2,0 to 7,79 COLO b+/N+
	@ 3,1 SAY "Party    :" GET m.pname VALI CHKID() WHEN EMPT(M.PNAME)
	@ 3,33 say "Item Name : " 
	@ 3,46 get m.code vali chkcode() size 1,3
	@ 3,51 get M.name pict '@!' size 1,25 when .f.
	@ 5,1 say "Bill Cost"
	@ 6,1 get m.cost size 1,9,2 vali CHK()

	@ 5,12 say " Qty/Mtr "
	@ 6,12 get m.qty VALI chkcost() size 1,9,2 

	@ 5,23 say " Pcs "
	@ 6,23 get m.pcs when salmas.type='M' size 1,5

	@ 5,30 say "R.D (1)" 
	@ 6,30 get m.rd size 1,7,2 

	@ 5,39 say "Disc(1)" 
	@ 6,39 get m.dis size 1,7,2 

	@ 5,47 say 'AG %'
	@ 6,47 get m.ag size 1,5,2 

	@ 5,53 say "R.D-2" 
	@ 6,53 get m.rd1 size 1,5,2 

	@ 5,59 say "Dis-2" 
	@ 6,59 get m.dis1 size 1,5,2 
	*vali chkncost() 

	@ 5,65 say "ADD" 
	@ 6,65 get m.ADDC size 1,5,2 vali chkncost() 
	
	@ 5,71 say " NCOST " 
	@ 6,71 get m.NCOST size 1,7,2 DISA 

*	@ 5,73 say "UNIT" 
*	@ 6,73 get m.unit pict "@M Pcs,Doz,Box,Set,Uni" size 1,3  
IF CDAT="SKA"
	@ 12,1 GET M.TAX SIZE 1,3
ENDI
	@ 12,2 say "Profit % : " get M.PRFT Size 1,6,2 color gr+/n+,gr+/n+ valid fixrate()
	@ 12,35 say 'Rate : ' get m.rrate Size 1,10,2 color gr+/n+,gr+/n+
	IF SALMAS.SIZE=.F.
		@ 12,58 say 'MRP : ' get m.MRP Size 1,10,2 color gr+/n+,gr+/n+
	ENDI
	@ 13,0 to 20,79 COLO b+/N+

	@ 14,1 say "TAG :" get m.quality pict '@!k' vali chkqual() WHEN CDAT="SCS" OR CDAT="SKT" OR CDAT="SKA" OR CDAT="SKR"
	@ 14,33 say "Dno's :" get m.dno1 pict '@!k' Size 1,15,0 VALI CHKDNO()
	@ 15,1 SAY "PATTERN:" 
	@ 15,10 GET M.PATTERN SIZE 1,15 VALI CHKPAT()
	@ 15,33 SAY "COLOR :" 
	@ 15,41 GET M.SLEEVE size 1,15 VALI CHKSLV()
	@ 15,57 SAY "SL:" GET M.SL SIZE 1,6
	@ 15,68 SAY "DIS %:" GET M.SALEDISC SIZE 1,3 WHEN DS=.T.
	@ 14,57 SAY "Size:" get m.size1 valid chksize(m.size1,1) when salmas.size=.t. 
	@ 14,65 SAY "X" get m.size2  when salmas.size=.t. 	valid chksize(m.size2,2) 
	@ 14,70  GET M.CLES PICT '@M 5,3' 
	IF CDAT="SKA" OR CDAT="SKR"
		@ 14,72 GET M.ZERO 
	ENDI

*	@ 14,58 SAY "Size :" get m.Osize1 valid chksize(m.Osize1,1) when salmas.size=.t. 
*	@ 14,67 SAY " X" get m.Osize2  when salmas.size=.t.
	@ 14,74 GET M.JC PICTURE '@M J,C,M' when salmas.size=.t.
	@ 16,74 GET TTD SIZE 1,2 when salmas.size=.t. AND M.JC="M" VALI !EMPT(TTD)
	@ 14,76 GET M.FV PICTURE '@M F,V' valid chksdisp() when salmas.size=.t.

*	@ 14,76  GET M.DET VALI CHKDETT()	

***FLAT RATE SIZE DIFF.IN Jr.ITEM
 	 

*	@ 15,1 to 15,77 COLO B+/N+
*	@ 15,0 SAY 'Ã' COLO B+/N+
*	@ 15,77 SAY '´' COLO B+/N+

		@ 17,2 get M.s1 size 1,4,0 when salmas.size=.t. AND !EMPT(R1) pict '@Z' 
		@ 17,8 get M.s2 size 1,4,0 when salmas.size=.t. AND !EMPT(R2) pict '@Z' 
	 	@ 17,14 get M.s3 size 1,4,0 when salmas.size=.t. AND !EMPT(R3) pict '@Z' 
		@ 17,20 get M.s4 size 1,4,0 when salmas.size=.t. AND !EMPT(R4) pict '@Z' 
		@ 17,26 get M.s5 size 1,4,0 when salmas.size=.t. AND !EMPT(R5) pict '@Z' 
		@ 17,32 get M.s6 size 1,4,0 when salmas.size=.t. AND !EMPT(R6) pict '@Z' 
		@ 17,38 get M.s7 size 1,4,0 when salmas.size=.t. AND !EMPT(R7) pict '@Z' 
		@ 17,44 get M.s8 size 1,4,0 when salmas.size=.t. AND !EMPT(R8) pict '@Z' 
		@ 17,50 get M.s9 size 1,4,0 when salmas.size=.t. AND !EMPT(R9) pict '@Z' 
		@ 17,56 get M.s10 size 1,4,0 when salmas.size=.t.	AND !EMPT(R10) pict '@Z' 
		@ 17,62 get M.s11 size 1,4,0 when salmas.size=.t. AND !EMPT(R11) pict '@Z'  
		@ 17,68 get M.s12 size 1,4,0 when salmas.size=.t.	AND !EMPT(R12) pict '@Z'  


**** Ready made Rating ****


		@ 18,2 get r1 size 1,4,0 when salmas.size=.t. AND !EMPT(R1) pict '@Z' valid chkpcs()
		@ 18,8 get r2 size 1,4,0 when salmas.size=.t. AND !EMPT(R2) pict '@Z'
	 	@ 18,14 get r3 size 1,4,0 when salmas.size=.t. AND !EMPT(R3) pict '@Z'
		@ 18,20 get r4 size 1,4,0 when salmas.size=.t. AND !EMPT(R4) pict '@Z'
 		@ 18,26 get r5 size 1,4,0 when salmas.size=.t. AND !EMPT(R5) pict '@Z'
		@ 18,32 get r6 size 1,4,0 when salmas.size=.t. AND !EMPT(R6) pict '@Z'
		@ 18,38 get r7 size 1,4,0 when salmas.size=.t. AND !EMPT(R7) pict '@Z'
		@ 18,44 get r8 size 1,4,0 when salmas.size=.t. AND !EMPT(R8) pict '@Z'
		@ 18,50 get r9 size 1,4,0 when salmas.size=.t. AND !EMPT(R9) pict '@Z'
		@ 18,56 get r10 size 1,4,0 when salmas.size=.t.	AND !EMPT(R10) pict '@Z'
		@ 18,62 get r11 size 1,4,0 when salmas.size=.t. AND !EMPT(R11) pict '@Z' 
		@ 18,68 get r12 size 1,4,0 when salmas.size=.t.	AND !EMPT(R12) pict '@Z' valid chkpcs()


		@ 19,2 get M.mrp1 size 1,4,0 when salmas.size=.t. AND !EMPT(R1) pict '@Z' 
		@ 19,8 get M.mrp2 size 1,4,0 when salmas.size=.t. AND !EMPT(R2) pict '@Z' 
	 	@ 19,14 get M.mrp3 size 1,4,0 when salmas.size=.t. AND !EMPT(R3) pict '@Z' 
		@ 19,20 get M.mrp4 size 1,4,0 when salmas.size=.t. AND !EMPT(R4) pict '@Z' 
		@ 19,26 get M.mrp5 size 1,4,0 when salmas.size=.t. AND !EMPT(R5) pict '@Z' 
		@ 19,32 get M.mrp6 size 1,4,0 when salmas.size=.t. AND !EMPT(R6) pict '@Z' 
		@ 19,38 get M.mrp7 size 1,4,0 when salmas.size=.t. AND !EMPT(R7) pict '@Z' 
		@ 19,44 get M.mrp8 size 1,4,0 when salmas.size=.t. AND !EMPT(R8) pict '@Z' 
		@ 19,50 get M.mrp9 size 1,4,0 when salmas.size=.t. AND !EMPT(R9) pict '@Z' 
		@ 19,56 get M.mrp10 size 1,4,0 when salmas.size=.t.	AND !EMPT(R10) pict '@Z' 
		@ 19,62 get M.mrp11 size 1,4,0 when salmas.size=.t. AND !EMPT(R11) pict '@Z'  
		@ 19,68 get M.mrp12 size 1,4,0 when salmas.size=.t.	AND !EMPT(R12) pict '@Z'  



******
	@ 20,30 get sav pict "@*HT SAVE;CANCEL"
	read
	if sav=1 and last()#27
		tdate=m.date
		sele item 
		go top
		Loca for uppe(allt(quality))=upper(allt(m.quality)) and val(code)=val(m.code) and val(pcode)=val(m.pcode) and ncost=m.ncost 
		If !found()
		DO WHILE .T.
		IF FLOCK("ITEM")
			pc=m.pcode
			sele item
			calc max(val(right(ledger,3))) to ff for val(left(ledger,4))=val(pc) and val(code)=val(m.code) 
			*m.ledger=conv(allt(m.pcode))+conv(allt(m.code))+conv1(allt(str(ff+1)))
			M.LEDGER='00000000000'
			m.qno=conv1(allt(str(ff+1)))
			sele item
			appe blank
			repl code with m.code
			repl ledger with m.ledger
			repl pcode with m.pcode
			repl ncost with m.ncost
			repl qno with m.qno
			repl quality with m.quality
			repl cost with m.cost
			REPL SIZE WITH CHANSIZE(ALLT(size1))+'/'+CHANSIZE(ALLT(size2))
			repl unit with m.unit
			repl edate with m.edate
			REPL RRATE WITH M.RRATE
			UNLOCK IN ITEM
			EXIT
		ENDI
		ENDD
		else
			m.ledger=item.ledger
			m.qno=item.qno
		endi

		Sele TEMP
		ttpid=m.pname
		ttcode=m.code
		TDIS=M.DIS
		TCLES=M.CLES
		TAG=M.AG
		TRD=M.RD
		TDIS1=M.DIS1
		TRD1=M.RD1
		ttpurno=m.purno
		TTACNO=M.ACNO
		ttpcode=m.pcode
		ttqual=m.quality
		IF PATT
			ttpat=m.pattern
		ENDI
		IF FXDNO
			TTDNO=M.DNO1
		ENDI
		tedate=m.edate
*		tdlat=m.dlat
		m.tamt=0
		wtax=m.tax
		TPRFT=M.PRFT
*	DO WHILE FLOCK("TEMP")
		
		SELE TEMP
		gath memv
		
		REPL TR1 WITH R1,TR2 WITH R2,TR3 WITH R3,TR4 WITH R4,TR5 WITH R5,TR6 WITH R6
		REPL TR7 WITH R7,TR8 WITH R8,TR9 WITH R9,TR10 WITH R10,TR11 WITH R11,TR12 WITH R12
		repl mac with tuser,lr with .t.,SIZE WITH ALLT(CHANSIZE(SIZE1))+"/"+ALLT(CHANSIZE(SIZE2)),;
		ITNAME WITH M.NAME,mrp with m.MRP,TAX WITH PURCHASE.TAX

		IF SIZE1="64" AND SIZE2="64"
			REPL SIZE WITH "55/55"
		ENDI

	


		Sum ncost*QTY,QTY,(NCOST*QTY)*(TAX/100) to ntot,NQTY,NTAX
		NSC=NTAX*purchase.sc/100
		@ 20,60 say "Total :"+str(ntot+NTAX+NSC,10,2)
		@ 20,1 say STR(NQTY,6)+"  "+str(ntot,9,2)+"  "+STR(NTAX,8,2)
		
		COUNT FOR EMPT(LEDGER) TO XYZ
		IF XYZ=0
			APPE BLANK
		ENDI
		KEYB "{END}"	
*		UNLOCK IN TEMP
*	EXIT
*	ENDD		

*	DO INOUTR

*store 0 to s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12
store 0 to r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12

ENDI

SELE TEMP
*sele pur
*endd
retu



proc chkparty
if empt(m.purno)
	retu 0
endi
SELE PURCHASE
SET ORDER TO ENTRYNO
SEEK M.PURNO
IF !FOUND()
	WAIT WIND "ENTRY NO."+ALLT(STR(M.PURNO))+" NOT FOUND...!" NOWA
	RETU 0
ENDI
*IF M.PURNO<=14168
*IF M.PURNO<=25737
IF M.PURNO<=37390
	WAIT WIND "PREVIOUS YEAR CANNOT CHANGE IT." NOWA
	RETU 0 
ENDI
IF !EMPTY(WDATE)
	Y='N'
	WAIT WIND "ENTRY LOCKED.....EDIT IT [Y/N] " TO Y
	IF UPPER(Y)#'Y'
		RETU 0
	ENDI	
ENDI	 

IF EDATE+2<=LDATE.DATE
	WAIT WIND "ENTRY LOCKED..... " NOWA
	RETU 0
ENDI
TTPURNO=M.PURNO
first=.f.
SELE TEMP
QQ=RECN()
COUNT TO DD
IF DD>1
		SELE TEMP
		GO QQ
		KEYB {"ENTER"}
ELSE
	IF USED("TEMP")
		SELE TEMP
		USE
	ENDI
	sele pur
	SELE 15
	USE
	SELECT *,SPAC(20) AS DETAIL1,SPAC(20) AS DETAIL2,SPAC(20) AS DETAIL3,SPAC(20) AS DETAIL4 FROM PUR WHERE purno=TTpurno INTO TABLE C:\TEMP
	SELE TEMP
	USE
	SELE 15
	USE
	USE C:\TEMP
	SELE TEMP
	SCAN
		SELE PURDET
		SET ORDER TO SERIAL
		SEEK TEMP.SERIAL
		IF FOUND()
			SELE TEMP
			REPL DETAIL1 WITH PURDET.DETAIL1,DETAIL2 WITH PURDET.DETAIL2,DETAIL3 WITH PURDET.DETAIL3,DETAIL4 WITH PURDET.DETAIL4
		ENDI
		SELE PURDET	
	ENDS

	*COPY TO C:\TEMP for purno=m.purno
	SELE 15
	USE
	USE C:\TEMP
	IF ALLT(CNT)="YES" AND XTTPURNO=M.PURNO
		APPEN FROM C:\TMP
		CNT="NO"
	ENDI
	APPE BLANK
ENDI

NTOT=0
NTAX=0
NQTY=0
NSC=0
*****

YYY=RECN()
SCAN
	NQTY=NQTY+QTY
	NTOT=NTOT+(NCOST*QTY)
	NTAX=NTAX+((NCOST*QTY)*TAX/100)
	NSC=NTAX*5/100
ENDS
GO YYY
	@ 20,1 say STR(NQTY,6)+"  "+str(ntot,9,2)+"  "+STR(NTAX,8,2)
	@ 20,60 say "Total :"+str(ntot+NTAX+NSC,10,2)
	
*****

rnil=.f.
TENT=LEFT(ALLT(STR(M.PURNO)),1)


SELE PURCHASE
SET ORDER TO entryno
SEEK M.PURNO

sele PARTY
set order to Pname
LOCA FOR PCODE=PURCHASE.PCODE
TTPID=PURCHASE.PNAME
M.PNAME=PARTY.PNAME
M.PCODE=PARTY.PCODE
M.EDATE=PURCHASE.POSTDATE
TTPCODE=PURCHASE.PCODE
tdate=purchase.creadate
****
IF YYY<=1
	DO DISCLESS
ENDI
SELE PARTY
*if !found()
*	rnil=.t.
*	SET CONF ON
*	defi popu party from 6,13 to 16,63 prom fiel pname+"³"+city titl "Supplier List" colo (COLR.POPUP) 
*	on sele popu party do selparty
*	on key label ctrl+ins do party
*	loca for name=ttpartyid
*	acti popu party rest
*	on key label ctrl+ins
*else
*	do selparty
*endi
*if empt(m.pname) or rnil=.t.
*	retu 0
*endi
SHOW GETS
sele pur
retu

proc selparty
rnil=.f.
m.PNAME=PARTY.Pname
m.Pcode=party.pcode
m.city=party.city
show gets
deac popu party
retu





proc chkcode
SET CONF ON
sele salmas
set filt to disp=.t. and type#'S' 
set orde to code
seek m.code
if !found()
	defi popu salmas from 3,20 to 20,76 prom fiel name+"³"+STR(TAX,5,2)+"³"+FLOOR titl "Item Name List" COLO W+/N+,W+/N+,W+/N+,W+/N+
	on sele popu salmas do selitem
	set order to name
	acti popu salmas rest
	set order to
else
	do selitem
endi
IF EMPT(M.CODE)
	RETU 0
ENDI
SELE SALMAS
SET FILT TO
sele pur
retu


proc selitem
m.code=salmas.code
m.name=salmas.name
show gets
deac popu salmas
retu










proc chkqual
if used("tqual")
	sele tqual
	use
endi
set safe off
sele ITEM
sele quality from item into tabl c:\tqual where PCODE=M.pcode and code=m.code group by quality
if used("tqual")
	sele tqual
	use
endi
use c:\tqual 
set safe off
sele tqual
SET CONF ON
defi popu quality from 5,10 to 20,40 prom fiel quality titl "Quality Name" COLO GB+/N+,W+/B+,GB+/N+,GB+/N+,GB+/N+ SHAD 
on sele popu quality do selqual
*on key label ctrl+ins do quality
loca for ALLT(quality)=ALLT(M.QUALITY)
acti popu quality rest

if empty(m.quality)
	retu 0
endi	
*on key label ctrl+ins
sele tqual
use
sele pur
retu


proc selqual
m.quality=tqual.quality
show gets
deac popu quality
retu


proc conv3
para d
	do case
		case len(d)=1
			retu '0000'+d
		case len(d)=2	
			retu '000'+d
		case len(d)=3	
			retu '00'+d
		case len(d)=4	
			retu '0'+d
		case len(d)=5	
			retu d
	endc
retu	

proc conv
para d
	do case
		case len(d)=1
			retu '000'+d
		case len(d)=2	
			retu '00'+d
		case len(d)=3	
			retu '0'+d
		case len(d)=4	
			retu d
	endc
retu	

proc conv1
para d
	do case
		case len(d)=1
			retu '00'+d
		case len(d)=2	
			retu '0'+d
		case len(d)=3	
			retu d
	endc
retu	

proc conv2
para d
	do case
		case len(d)=1	
			retu '0'+d
		case len(d)=2	
			retu d
	endc
retu	



proc chkcost
if m.qty=0
	retu 0
endi
if m.cost=0
	retu 0
else
	M.NCOST=M.COST
	m.price=round(m.cost+(m.cost*10/100),0)
	m.tamt=m.cost*m.qty
*	@ 13,20 say "Amount :"+str(m.tamt)
	show gets
endi
retu



proc chkid
set conf on
sele party
set order to pname
locat for upper(allt(pname))=upper(allt(m.pname))
if !found()
	defi popu pp from 6,1 to 20,79 prom fiel padr(pname,30)+'³'+padr(agent,25)+'³'+padr(city,23) titl "Party ID List" COLO W+/N+,W+/N+,W+/N+,W+/N+
	on sele popu pp do selpp
*	on key labe Ctrl+Ins do partyadd
	loca for pname=ttpid
	acti popu pp rest
else
	do selpp
endi
if empty(m.pcode)
	on key labe Ctrl+Ins
	retu 0
endi	
on key labe Ctrl+Ins
retu




proc selpp
m.pcode=party.pcode
m.pname=party.pname
TPCODE=M.PCODE
show gets
deac popu pp
retu



proc paise
PARA RT
gtt=0.00
gtt=ABS(RT)-int(ABS(RT))
do case
	case gtt<=.20
		gt=int(RT)
	case gtt>=.21 and gtt<=.70
		gt=int(RT)+.50
	case gtt>=.71
		gt=round(RT,0)
endc
retu GT



proc paise1
PARA RT
gtt=0.00
gtt=ABS(RT)-int(ABS(RT))
do case
	case gtt<=.19
		gt=int(RT)
	case gtt>=.20 
		gt=ceil(RT)
endc
retu GT


proc chkncost
xxx=(m.cost+m.rd)-((m.cost+m.rd)*m.dis/100)
XXX=(XXX+m.RD1)-((XXX+m.RD1)*m.DIS1/100)
m.ncost=xxx+M.ADDC
show gets
retu


proc fixrate
IF M.PRFT<=0
	wait wind "Enter Profit %.." nowa
	retu 0
endi	
if cdat="SKA" OR CDAT="SKR"
*	WAIT WIND "Last Rate :"+str(M.mrp,10,2) nowa
	WAIT WIND "Last Rate :"+str(M.RRATE,10,2) nowa
endi
xxx=(m.cost+m.rd)-((m.cost+m.rd)*m.dis/100)
XXX=(XXX+m.RD1)-((XXX+m.RD1)*m.DIS1/100)
M.NCOST = XXX
*******LCOST
		TDISC=((PURCHASE.DISC/PURCHASE.INVAMT*100)*M.NCOST/100)
		CLCOST=M.NCOST-TDISC+((M.NCOST-TDISC)*M.TAX/100)+(((M.NCOST-TDISC)*M.TAX/100)*PURCHASE.SC/100)+((PURCHASE.PACKING/PURCHASE.INVAMT*100)*M.NCOST/100)+((PURCHASE.OTHERS/PURCHASE.INVAMT*100)*M.NCOST/100)
		M.LCOST=CLCOST+(CLCOST*PURCHASE.PROFIT/100)+(CLCOST*PURCHASE.RST/100)
*******
@ 12,22 SAY STR(M.LCOST,10,2) COLO G+
M.NETCOST=M.LCOST
*******FROM AGENCIES MARGIN
IF CDAT="SKA" AND VAL(M.PCODE)#1
	IF M.TAX#1
		IF PURCHASE.SC#0
			TLCOST=M.LCOST+(M.LCOST*4.2/100)
		ELSE
			TLCOST=M.LCOST+(M.LCOST*4/100)
		ENDI
	ELSE
		TLCOST=M.LCOST+(M.LCOST*4/100)
	ENDI
	M.NETCOST=TLCOST
	M.RRATE=ROUND((TLCOST+(TLCOST*M.PRFT/100)),0)
ELSE
	M.RRATE=ROUND((M.LCOST+(M.LCOST*M.PRFT/100)),0)
ENDI

SSS=VAL(RIGHT(ALLT(STR(M.RRATE)),1))
*IF M.CODE#"128" AND M.CODE#"134" AND M.CODE#"126" AND M.CODE#"125" AND M.CODE#"124";
*AND M.CODE#"132" AND M.CODE#"139" AND M.CODE#"140" AND M.CODE#"145"

*IF M.CODE#"113" AND M.CODE#"118" AND M.CODE#"139" AND M.CODE#"114" ;
*AND M.CODE#"115" AND M.CODE#"116" AND M.CODE#"117"  AND M.CODE#"118" 
IF 1=2
DO CASE
	CASE SSS=1 
		M.RRATE=M.RRATE-1
	CASE SSS=2
		M.RRATE=M.RRATE-2
	CASE SSS=3
		M.RRATE=M.RRATE+2
	CASE SSS=4
		M.RRATE=M.RRATE+1
	CASE SSS=5
		M.RRATE=M.RRATE
	CASE SSS=6
		M.RRATE=M.RRATE-1
	CASE SSS=7
		M.RRATE=M.RRATE-2
	CASE SSS=8
		M.RRATE=M.RRATE+2
	CASE SSS=9
		M.RRATE=M.RRATE+1
	CASE SSS=0
		M.RRATE=M.RRATE
ENDC
ELSE
	M.RRATE=M.RRATE
ENDI

*m.rrate=ROUND((m.NCOST+(m.NCOST*M.PRFT/100)),0)




show gets
retu

proc fixrrate
   SELECT RMAST
   SET ORDER TO LEDGER
   SEEK M.LEDGER
   IF .NOT.FOUND()
      APPEND BLANK
      REPLACE LEDGER WITH M.LEDGER, EDATE WITH DATE()
   ENDIF
   DO CASE
   	CASE M.JC='J'
	      DD = 2
   	CASE M.JC='C'
	      DD = 1
	CASE M.JC='M'
		  DD = TTD
   ENDC
   IF EMPTY(M.SIZE2)
      M.SIZE2 = M.SIZE1
   ENDIF
	   FOR KK = VAL(M.SIZE1) TO VAL(M.SIZE2) STEP DD
	      REPLACE ('S'+ALLTRIM(STR(KK))) WITH M.RATE
	   ENDFOR
RETU  




FUNCTION  CHKSIZE
PARAMETER SZ,XX
IF EMPTY(SZ)
	wait wind "Enter Size...." nowa 
	retu 0
*   IF XX=2
*  		M.SIZE2=''
*   ENDI
   RETURN 0
ENDIF
*IF (VAL(SZ)>=0.AND.VAL(SZ)<=99).OR.(SZ='F'.OR.SZ='S'.OR.SZ='M'.OR.SZ='L'.OR.SZ='XL'.OR.SZ='2L'.OR.SZ='3L' OR SZ='OS' OR SZ='55'OR SZ='45')
IF (VAL(SZ)>=0 AND VAL(SZ)<=99) OR (SZ='F' OR SZ='S' OR SZ='M' OR SZ='L' OR SZ='XL' OR SZ='2L' OR SZ='3L' OR SZ='OS' OR SZ='55'OR SZ='45' OR SZ='1S' OR SZ='2S')

   YSIZ=0
   DO CASE
      CASE SZ='F' 
      	IF XX=1
	         M.SIZE1 = '45'
	    ELSE
        	 M.SIZE2 = '45'
        ENDI
      CASE SZ='S' 
      	IF XX=1
	         M.SIZE1 = '47'
	    ELSE
	         M.SIZE2 = '47'
	    ENDI
      CASE SZ='M' 
      	IF XX=1
	         M.SIZE1 = '49'
	    ELSE
	         M.SIZE2 = '49'
	    ENDI
      CASE SZ='L' 
      	IF XX=1
	         M.SIZE1 = '51'
	    ELSE
	         M.SIZE2 = '51'
	    ENDI
      CASE SZ='XL'
      	IF XX=1
	         M.SIZE1 = '53'
	    ELSE
	         M.SIZE2 = '53'
	    ENDI
      CASE SZ='2L'
      	IF XX=1
	         M.SIZE1 = '55'
	    ELSE
        	 M.SIZE2 = '55'
       	ENDI
      CASE SZ='3L'
      	IF XX=1
	         M.SIZE1 = '57'
	    ELSE
	         M.SIZE2 = '57'
	    ENDI
      CASE SZ='4L'
      	IF XX=1
	         M.SIZE1 = '67'
	    ELSE
	         M.SIZE2 = '67'
	    ENDI
      CASE SZ='5L'
      	IF XX=1
	         M.SIZE1 = '69'
	    ELSE
	         M.SIZE2 = '69'
	    ENDI
      CASE SZ='6L'
      	IF XX=1
	         M.SIZE1 = '71'
	    ELSE
	         M.SIZE2 = '71'
	    ENDI

      CASE SZ='A0' OR SZ='58'
      	 IF XX=1
	         M.SIZE1 = '58'
			 XSIZ=100      	 
	     ELSE
	     	 M.SIZE2 = '58'
			 YSIZ=100      	 
	     ENDI
      CASE SZ='A5'
      	 IF XX=1
			 XSIZ=105
	         M.SIZE1 = '59'
	     ELSE
			 YSIZ=105
	     	 M.SIZE2 = '59'
	     ENDI
      CASE SZ='B0'
      	 IF XX=1
			 XSIZ=110
	         M.SIZE1 = '61'
	     ELSE
		 	 YSIZ=110
	     	 M.SIZE2 = '61'
	     ENDI
      CASE SZ='B5'
      	 IF XX=1
			 XSIZ=115
	         M.SIZE1 = '62'
	     ELSE
			 YSIZ=115
	     	 M.SIZE2 = '62'
	     ENDI
      CASE SZ='OS'
      	 IF XX=1
	         M.SIZE1 = '63'
	     ELSE
	     	 M.SIZE2 = '63'
	     ENDI
      CASE SZ='55'
      	 IF XX=1
	         M.SIZE1 = '64'
	     ELSE
	     	 M.SIZE2 = '64'
	     ENDI
      CASE SZ='45'
      	 IF XX=1
	         M.SIZE1 = '66'
	     ELSE
	     	 M.SIZE2 = '66'
	     ENDI

*      CASE SZ='00'
 *     	 IF XX=1
	*         M.SIZE1 = '73'
	 *    ELSE
	  *   	 M.SIZE2 = '73'
	   *  ENDI


      CASE SZ='1S'
      	 IF XX=1
	         M.SIZE1 = '77'
	     ELSE
	     	 M.SIZE2 = '77'
	     ENDI

      CASE SZ='2S'
      	 IF XX=1
	         M.SIZE1 = '79'
	     ELSE
	     	 M.SIZE2 = '79'
	     ENDI

	  OTHER
	  	 IF XX=1
	  		 M.SIZE1 = SZ
	  	 ELSE
	  	     M.SIZE2 = SZ
	  	 ENDI
   ENDCASE
ELSE
   WAIT WINDOW NOWAIT 'Size Range [0,1...,99]'
   RETURN 0
ENDIF
RETURN


proc chksdisp
IF NW=.F.
	RETU
ENDI
IF M.FV='F'
	M.CLES='0'
ENDI
FOR IXX=1 TO 12
	QA="M.ts"+ALLT(STR(IXX))
	QS="M.s"+ALLT(STR(IXX))
	QR="R"+	ALLT(STR(IXX))
	&QA=0
	&QS=0
	&QR=0
ENDF
   DO CASE
   	CASE M.JC='J'
	      DD = 2
   	CASE M.JC='C'
	      DD = 1
	CASE M.JC='M'
		  DD = TTD
   ENDC
   IF EMPTY(M.SIZE2)
      M.SIZE2 = M.SIZE1
   ENDIF
   i=1
   ZZ=16
	@ZZ,1 to ZZ,76 clea
	if val(m.size1)#0
	   FOR KK = IIF(XSIZ=0,VAL(M.SIZE1),XSIZ) TO IIF(YSIZ=0,VAL(M.SIZE2),YSIZ) STEP DD
		do case
			case i=1	
				@ ZZ,2 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts1=RCHANSIZ(kk)
				ELSE
					M.TS1=KK
				ENDI
			case i=2	
				@ ZZ,8 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts2=RCHANSIZ(kk)
				ELSE
					M.TS2=KK
				ENDI
			case i=3	
				@ ZZ,14 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts3=RCHANSIZ(kk)
				ELSE
					M.TS3=KK
				ENDI
			case i=4	
				@ ZZ,20 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts4=RCHANSIZ(kk)
				ELSE
					M.TS4=KK
				ENDI
			case i=5	
				@ ZZ,26 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts5=RCHANSIZ(kk)
				ELSE
					M.TS5=KK
				ENDI
			case i=6	
				@ ZZ,32 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts6=RCHANSIZ(kk)
				ELSE
					M.TS6=KK
				ENDI
			case i=7	
				@ ZZ,38 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts7=RCHANSIZ(kk)
				ELSE
					M.TS7=KK
				ENDI
			case i=8	
				@ ZZ,44 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts8=RCHANSIZ(kk)
				ELSE
					M.TS8=KK
				ENDI
			case i=9	
				@ ZZ,50 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts9=RCHANSIZ(kk)
				ELSE
					M.TS9=KK
				ENDI
			case i=10	
				@ ZZ,56 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts10=RCHANSIZ(kk)
				ELSE
					M.TS10=KK
				ENDI
			case i=11
				@ ZZ,62 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts11=RCHANSIZ(kk)
				ELSE
					M.TS11=KK
				ENDI
			case i=12	
				@ ZZ,68 say "S-"+ALLT(STR(KK))
				IF XSIZ#0 OR YSIZ#0
					M.ts12=RCHANSIZ(kk)
				ELSE
					M.TS12=KK
				ENDI
			endc	
	i=i+1	
   ENDFOR
   QQQ=1
   else
	I=1
	   FOR KK = 0 TO VAL(M.SIZE2) STEP DD
		do case
			case i=1
				@ ZZ,2 say "S-"+ALLT(STR(KK))
				M.ts1=kk
			case i=2	
				@ ZZ,8 say "S-"+ALLT(STR(KK))
				M.ts2=kk
			case i=3	
				@ ZZ,14 say "S-"+ALLT(STR(KK))
				M.ts3=kk
			case i=4	
				@ ZZ,20 say "S-"+ALLT(STR(KK))
				M.ts4=kk
			case i=5	
				@ ZZ,26 say "S-"+ALLT(STR(KK))
				M.ts5=kk
			case i=6	
				@ ZZ,32 say "S-"+ALLT(STR(KK))
				M.ts6=kk
			case i=7	
				@ ZZ,38 say "S-"+ALLT(STR(KK))
				M.ts7=kk
			case i=8	
				@ ZZ,44 say "S-"+ALLT(STR(KK))
				M.ts8=kk
			case i=9	
				@ ZZ,50 say "S-"+ALLT(STR(KK))
				M.ts9=kk
			case i=10	
				@ ZZ,56 say "S-"+ALLT(STR(KK))
				M.ts10=kk
			case i=11
				@ ZZ,62 say "S-"+ALLT(STR(KK))
				M.ts11=kk
			case i=12	
				@ ZZ,68 say "S-"+ALLT(STR(KK))
				M.ts12=kk
			endc	
	i=i+1	
   ENDFOR
   QQQ=1
   endi	

   FOR X =1 TO (I-1 )
		T='S'+ALLTRIM(STR(X))
		&T=ROUND(M.QTY/(I-1),0)
		SHOW GETS
   ENDF
   YYY=0
   TTT=0
   ZZX=I%2
   IF ZZX#0
   	  WWX=0
  	  CENTRE=(I-1)/2
   ELSE
   	  CENTRE=(I)/2
	  WWX=1
   ENDI
	
   XRATE=M.RRATE
   XRATE1=M.COST

*********NEW 
	IF ZZX=0
	  	DO CASE
  			CASE XRATE<500
			   XPER=ROUND(XRATE*(VAL(M.CLES)/100),0)
	  		CASE XRATE>=500
			   XPER=ROUND(XRATE*(VAL(M.CLES)/100),0)
  		ENDC
	ELSE
	  	DO CASE
  			CASE XRATE<500
			   XPER=ROUND(XRATE*((VAL(M.CLES)/100)/2),0)
			   XRATE=XRATE-XPER
			   XPER=XPER*2	
	  		CASE XRATE>=500
			   XPER=ROUND(XRATE*((VAL(M.CLES)/100)/2),0)
			   XRATE=XRATE-XPER
			   XPER=XPER*2	
		ENDC

	ENDI


***********OLD
IF 1=2
	IF ZZX=0
	  	DO CASE
  			CASE XRATE1<500
			   XPER=ROUND(XRATE*.05,0)
	  		CASE XRATE1>=500
			   XPER=ROUND(XRATE*.03,0)
  		ENDC
	ELSE
	  	DO CASE
  			CASE XRATE1<500
			   XPER=ROUND(XRATE*.025,0)
			   XRRATE=XRATE-XPER
			   XPER=XPER*2
	  		CASE XRATE1>=500
			   XPER=ROUND(XRATE*.015,0)
			   XRRATE=XRATE-XPER
			   XPER=XPER*2
  		ENDC
		
	ENDI
ENDI
***************


FOR X = 1 TO (I-1)
	T='R'+ALLTRIM(STR(X))
	IF M.FV="V"	
		DO CASE
			CASE X<((I-WWX)/2)
				&T=XRATE-(XPER*(CENTRE-X))
			CASE X=((I)/2)
				&T=XRATE
			CASE X>((I)/2)
				TTT=TTT+1
				&T=XRATE+(XPER*TTT)
		ENDC
	ELSE
		&T=XRATE
	ENDI
	SHOW GETS 
ENDF

RETU



proc chkpcs
XR1=M.R1
XR2=M.R2
XR3=M.R3
XR4=M.R4
XR5=M.R5
XR6=M.R6
XR7=M.R7
XR8=M.R8
XR9=M.R9
XR10=M.R10
XR11=M.R11
XR12=M.R12

if salmas.size=.f.
	retu
else
if m.qty=(m.s1+m.s2+m.s3+m.s4+m.s5+m.s6+m.s7+m.s8+m.s9+m.s10+m.s11+m.s12)
	retu
else
	wait wind "Pieces Not Tallied...Verify.." nowa 
	retu -11
endi	
endi





PROC INOUTRN
WAIT WIND "Processing ..........Wait..." nowa
SELE TEMP
GO TOP
SCAN FOR !EMPT(LEDGER)
SELE SALMAS
SET ORDER TO CODE
SEEK TEMP.CODE
SELE INOUT
IF SALMAS.SIZE=.T.
***** READY MADE *****
	SET REPROCESS TO AUTOMATIC
	DO WHILE FLOCK("INOUT")
		FOR I=1 TO 12
			ZZZ="TEMP.TS"+ALLT(STR(I))
			YYY="TEMP.S"+ALLT(STR(I))
			XXX="TEMP.TR"+ALLT(STR(I))
			MR="TEMP.MRP"+ALLT(STR(I))
			
			IF &XXX#0 AND &YYY#0 
				TSERIAL=CONV(ALLT(TEMP.CODE))+ALLT(STR(TEMP.SERIAL))
				append blank
				repl ledger with allt(TSERIAL)+IIF(QQQ=1,conv2(ALLT(STR(&ZZZ))),00)+CONV3(ALLT(STR(&XXX)))
				REPL IN WITH &YYY,TYPE WITH 2,DATE WITH TEMP.DATE,PURNO WITH TEMP.PURNO,SERNO WITH ALLT(STR(TEMP.SERIAL))
	
				SELE BARC
				FOR CCC=1 TO INOUT.IN
					APPE BLANK
					repl ledger with allt(TSERIAL)+IIF(QQQ=1,conv2(ALLT(STR(&ZZZ))),00)+CONV3(ALLT(STR(&XXX))),;
					SIZE WITH IIF(QQQ=1,conv2(ALLT(STR(&ZZZ))),"0"),RRATE WITH &XXX,SNAME WITH PARTY.PNAME,SIZE WITH IIF(QQQ=1,CHANSIZE(ALLT(STR(&ZZZ))),"0"),NCOST WITH TEMP.NETCOST,DNO1 WITH ALLT(TEMP.DNO1),MESS WITH '',DATE WITH INOUT.DATE,MRP WITH ALLT(STR(&MR)),;
					REFNO WITH PURCHASE.ENTRYNO,SLEEVE WITH TEMP.SLEEVE,PATTERN WITH TEMP.PATTERN,SL WITH TEMP.SL,LRDT WITH PURCHASE.LRDATE,DETAIL1 WITH TEMP.DETAIL1,DETAIL2 WITH TEMP.DETAIL2,DETAIL3 WITH TEMP.DETAIL3,DETAIL4 WITH TEMP.DETAIL4,SALEDISC WITH TEMP.SALEDISC,RNO WITH RECNO();
					RETURN WITH TEMP.RETURN
					IF ALLT(TEMP.SIZE1)=ALLT(TEMP.SIZE2)
						REPL SETSIZE WITH CHANSIZE(ALLT(TEMP.SIZE1))
					ELSE
						REPL SETSIZE WITH TEMP.SIZE
					ENDI					

					IF TEMP.ZERO=.F.
						REPL SIZE WITH ''
					ENDI
					SELE PARTY
					SET ORDER TO PCODE
					SEEK TEMP.PCODE
					IF FOUND()
						SELE BARC
						REPL SNAME WITH PARTY.PNAME,PNAME WITH PARTY.PNAME,AGENT WITH LEFT(ALLT(PARTY.AGENT),1)+RIGHT(ALLT(PARTY.AGENT),1)+LEFT(ALLT(PARTY.CITY),1)+RIGHT(ALLT(PARTY.CITY),1)
						REPL AGENTN WITH ALLT(PARTY.CSNAME)+"-"+ALLT(PARTY.ASNAME)
					ENDI
					SELE SALMAS
					SET ORDER TO CODE
					SEEK TEMP.CODE
					IF FOUND()
						SELE BARC
						REPL INAME WITH SALMAS.NAME,PSIZE WITH SALMAS.SIZE
					ENDI
					REPL TAG WITH ALLT(TEMP.QUALITY)
					SELE BARC
				ENDF

				SELE INOUT
			ENDI
		ENDF
		UNLOCK IN INOUT
	EXIT
	ENDD

ELSE
***** WITHOUT SIZE 

	DO WHILE FLOCK("INOUT")	
	IF TEMP.QTY#0 
		TSERIAL=CONV(ALLT(TEMP.CODE))+ALLT(STR(TEMP.SERIAL))

		append blank
		gath memv
		repl ledger with allt(TSERIAL)+"00"+CONV3(ALLT(STR(TEMP.RRATE)))
		REPL IN WITH TEMP.QTY,TYPE WITH 2,DATE WITH TEMP.DATE,PURNO WITH TEMP.PURNO,SERNO WITH ALLT(STR(TEMP.SERIAL))
		
		SELE BARC
		FOR CCC=1 TO INOUT.IN
			IF TEMP.RETURN=.F.
			APPE BLANK
			repl ledger with allt(TSERIAL)+"00"+CONV3(ALLT(STR(TEMP.RRATE))),;
			Rrate with temp.rrate,MRP WITH ALLT(STR(TEMP.MRP)),SNAME WITH PARTY.PNAME,MESS WITH CHANYEA(INOUT.DATE),DATE WITH INOUT.DATE,REFNO WITH PURCHASE.ENTRYNO,NCOST WITH TEMP.NCOST,DNO1 WITH TEMP.DNO1,MESS WITH '',DATE WITH INOUT.DATE,;
		    REFNO WITH PURCHASE.ENTRYNO,SLEEVE WITH TEMP.SLEEVE,PATTERN WITH TEMP.PATTERN,SL WITH TEMP.SL,LRDT WITH PURCHASE.LRDATE,DETAIL1 WITH TEMP.DETAIL1,DETAIL2 WITH TEMP.DETAIL2,DETAIL3 WITH TEMP.DETAIL3,DETAIL4 WITH TEMP.DETAIL4,SALEDISC WITH TEMP.SALEDISC,RNO WITH RECNO();
			RETURN WITH TEMP.RETURN
			SELE PARTY
			SET ORDER TO PCODE
			SEEK TEMP.PCODE
			IF FOUND()
				SELE BARC
				REPL SNAME WITH PARTY.PNAME,PNAME WITH PARTY.PNAME,AGENT WITH LEFT(ALLT(PARTY.AGENT),1)+RIGHT(ALLT(PARTY.AGENT),1)+LEFT(ALLT(PARTY.CITY),1)+RIGHT(ALLT(PARTY.CITY),1)
				REPL AGENTN WITH ALLT(PARTY.CSNAME)+"-"+ALLT(PARTY.ASNAME)
			ENDI
			SELE SALMAS
			SET ORDER TO CODE
			SEEK TEMP.CODE
			IF FOUND()
				SELE BARC
				REPL INAME WITH SALMAS.NAME,PSIZE WITH SALMAS.SIZE
			ENDI
			REPL TAG WITH ALLT(TEMP.QUALITY)
			SELE BARC
			ENDI
			SELE BARC
		ENDF
	ENDI

	UNLOCK IN INOUT
	EXIT
	ENDD		
ENDI
	SELE TEMP
ENDS
RETU



PROC DELT
SELE TEMP
DELE
RETU








PROC CHKACNO
IF LAST()=19
	RETU 0
ENDI
ASD=ALIAS()
SELE PURCHASE
SET ORDER TO entryno
SEEK M.PURNO
sele PARTY
set order to Pname
LOCA FOR PCODE=PURCHASE.PCODE
TTPID=PURCHASE.PNAME
M.PNAME=PARTY.PNAME
M.PCODE=PARTY.PCODE
M.EDATE=PURCHASE.POSTDATE
SELE (ASD)
RETU




FUNC RCHANSIZ
PARA XSIZE
DO CASE
	CASE XSIZE=100
		XSIZE='58'
	CASE XSIZE=105
		XSIZE='59'
	CASE XSIZE=110
		XSIZE=61
	CASE XSIZE=115
		XSIZE='62'
ENDC
SHOW GETS
RETU XSIZE


PROC CHK
IF EMPT(M.COST)
	RETU 0
ENDI
RETU



PROC SHORTCUT
FOR IA=_CUROBJ TO 17
	KEYB "{ENTER}"
ENDF
if !empt(m.s1)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s2)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s3)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s4)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s5)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s6)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s7)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s8)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s9)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s10)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s11)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
if !empt(m.s12)
	KEYB "{ENTER}"
	KEYB "{ENTER}"
endi
RETU


PROC CHKSLV
IF ALLT(M.SLEEVE)='.'
	WAIT WIND ".(DOT) IS NOT VALID COLOR" NOWA
	RETU 0
ENDI
SELE SLEEVE
SET ORDE TO NAME
GO TOP
DEFI POPU SLV FROM 10,27 TO 23,43 PROM FIEL NAME COLO GB+/N+,W+/B+,GB+/N+,GB+/N+,GB+/N+ SHAD 
ON SELE POPU SLV DO SLV
ON KEY LABEL CTRL+INS DO SLEEVE
LOCA FOR NAME=M.SLEEVE
IF M.SLEEVE#"."
	ACTI POPU SLV REST
ENDI
DO DETAIL
SELE TEMP
RETU


PROC SLV
M.SLEEVE=SLEEVE.NAME
M.SLVNO=SLEEVE.CODE
SHOW GETS
DEAC POPU SLV
RETU


PROC CHKPAT
IF ALLT(M.PATTERN)='.'
	WAIT WIND ".(DOT) IS NOT VALID PATTERN" NOWA
	RETU 0
ENDI
IF F8=.F. AND F10=.F.
	IF ALLT(M.PATTERN)='0'
		SELE PATTERN
		SET ORDER TO NAME
		GO TOP
		DEFI POPU PAT FROM 8,11 TO 23,32 PROM FIEL NAME COLO GB+/N+,W+/B+,GB+/N+,GB+/N+,GB+/N+ SHAD 
		ON SELE POPU PAT DO PAT
		ON KEY LABEL CTRL+INS DO PATTERN1
		LOCA FOR NAME=M.PATTERN
		IF M.PATTERN#"."
			ACTI POPU PAT REST
		ENDI
		SELE TEMP
	ELSE
		TTQUA=M.QUALITY
		SELE PATTERN AS NAME1 FROM PUR WHERE QUALITY=TTQUA AND !EMPT(PATTERN) INTO CURS TXPAT ORDE BY PATTERN  GROU BY PATTERN
		SELE TXPAT
		GO TOP
		DEFI POPU PAT FROM 8,11 TO 23,32 PROM FIEL NAME1 COLO GB+/N+,W+/B+,GB+/N+,GB+/N+,GB+/N+ SHAD 
		ON SELE POPU PAT DO PAT1
		ON KEY LABEL CTRL+INS DO PATTERN1
		LOCA FOR NAME=M.PATTERN
		IF M.PATTERN#"."
			ACTI POPU PAT REST
		ENDI
	ENDI
ELSE
	TTQUA=M.QUALITY
	SELE PATTERN AS NAME1,ALLT(SUBS(PATTERN,6,30))+" "+SUBS(PATTERN,1,1)+" "+SUBS(PATTERN,2,4) AS NAME FROM PUR WHERE QUALITY=TTQUA AND !EMPT(PATTERN) INTO CURS TXPAT ORDE BY PATTERN GROU BY PATTERN
	SELE TXPAT
	GO TOP
	DEFI POPU PAT FROM 8,11 TO 23,32 PROM FIEL NAME COLO GB+/N+,W+/B+,GB+/N+,GB+/N+,GB+/N+ SHAD 
	ON SELE POPU PAT DO PAT1
	ON KEY LABEL CTRL+INS DO PATTERN1
	LOCA FOR NAME=M.PATTERN
	IF M.PATTERN#"."
		ACTI POPU PAT REST
	ENDI
ENDI
SELE TEMP
RETU


PROC PAT
M.PATTERN=PATTERN.NAME
M.PATNO=PATTERN.CODE
SHOW GETS
DEAC POPU PAT
RETU


PROC PAT1
M.PATTERN=TXPAT.NAME1
SHOW GETS
DEAC POPU PAT
RETU


PROC CHKDNO
IF ALLT(M.DNO1)='.'
	WAIT WIND ".(DOT) IS NOT VALID DESING" NOWA
	RETU 0
ENDI
XXPCODE=M.PCODE
XXCODE=M.CODE
SELECT DNO1 FROM PUR WHERE PCODE=XXPCODE AND CODE=XXCODE INTO CURS DESIGN ORDER BY DNO1 GROUP BY DNO1
SELE DESIGN
GO TOP
DEFI POPU DNO FROM 9,41 TO 23,62 PROM FIEL DNO1 COLO GB+/N+,W+/B+,GB+/N+,GB+/N+,GB+/N+ SHAD 
ON SELE POPU DNO DO DNO
LOCA FOR DNO1=M.DNO1
IF M.DNO1#"."
	ACTI POPU DNO REST
ENDI
SELE TEMP
RETU


PROC DNO
M.DNO1=DESIGN.DNO1
SHOW GETS
DEAC POPU DNO
RETU




PROC DETAIL
IF F8=.T.
	F10=.F.
	M.DETAIL1=PADR(SUBS(M.PATTERN,6,30),25)
	M.DETAIL2=PADR(SUBS(M.PATTERN,1,1)+" "+SUBS(M.PATTERN,2,4),20)
ENDI
IF F10=.T.
	F8=.F.
	DO CASE
		CASE ALLT(M.NAME)="BANIAN RN"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' RN',25)
		CASE ALLT(M.NAME)="BANIAN RNS"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' RNS',25)
		CASE ALLT(M.NAME)="BABY DRAWER"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' DRAWER',25)
		CASE ALLT(M.NAME)="BABY JETTY"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' JETTY',25)
		OTHER
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' '+ALLT(M.NAME),25)
	ENDC
	M.DETAIL2=PADR(SUBS(M.PATTERN,1,1)+" "+SUBS(M.PATTERN,2,4),25)
ENDI

SELE TEMP
DEFI WIND QWW FROM 9,25 TO 15,60 COLO SCHE 5 NONE
ACTI WIND QWW
@ 0,0 SAY PADC("DETAILS ENTRY",36) COLO SCHE 1
@ 2,1 SAY "DET 1 :" GET M.DETAIL1 
@ 3,1 SAY "DET 2 :" GET M.DETAIL2
@ 4,1 SAY "DET 3 :" GET M.DETAIL3
@ 5,1 SAY "DET 4 :" GET M.DETAIL4
READ
RELE WIND QWW
RETU


PROC MRP
DEFI WIND QSS FROM 12,2 TO 14,75 COLO SCHE 10 NONE
ACTI WIND QSS
@ 1,2 get M.mr1 size 1,4,0 
@ 1,8 get M.mr2 size 1,4,0 
@ 1,14 get M.mr3 size 1,4,0 
@ 1,20 get M.mr4 size 1,4,0 
@ 1,26 get M.mr5 size 1,4,0 
@ 1,32 get M.mr6 size 1,4,0 
@ 1,38 get M.mr7 size 1,4,0 
@ 1,44 get M.mr8 size 1,4,0 
@ 1,50 get M.mr9 size 1,4,0 
@ 1,56 get M.mr10 size 1,4,0 
@ 1,62 get M.mr11 size 1,4,0 
@ 1,68 get M.mr12 size 1,4,0 
READ
RELE WIND QWW
RETU

PROC CHKDET
F8=.T.
F10=.F.
M.DETAIL1=PADR(SUBS(M.PATTERN,6,30),25)
M.DETAIL2=PADR(SUBS(M.PATTERN,1,1)+" "+SUBS(M.PATTERN,2,4),20)
RETU


PROC CHKDET1
F10=.T.
F8=.F.
	DO CASE
		CASE ALLT(M.NAME)="BANIAN RN"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' RN',25)
		CASE ALLT(M.NAME)="BANIAN RNS"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' RNS',25)
		CASE ALLT(M.NAME)="BABY DRAWER"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' DRAWER',25)
		CASE ALLT(M.NAME)="BABY JETTY"
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' JETTY',25)
		OTHER
			M.DETAIL1=PADR(ALLT(SUBS(M.PATTERN,6,30))+' '+ALLT(M.NAME),25)
	ENDC
	M.DETAIL2=PADR(SUBS(M.PATTERN,1,1)+" "+SUBS(M.PATTERN,2,4),25)
RETU


PROC PATT
IF PATT=.T.
	PATT=.F.
ELSE
	PATT=.T.
ENDI

PROC FXDNO
IF FXDNO=.T.
	FXDNO=.F.
ELSE
	FXDNO=.T.
ENDI


PROC DS
IF DS=.F.
	DS=.T.
ELSE
	DS=.F.
ENDI		



PROC DISCLESS
WAIT WIND "PROCESSING WAIT.....!" NOWA
SELECT DATE,PURNO,DIS,RD,DIS1,RD1,PROFIT,ITNAME FROM PUR WHERE PCODE=TTPCODE GROUP BY PURNO ORDER BY DATE DESC INTO CURS QWER
DEFI WIND QWE FROM 2,15 TO 22,65 COLO G+/N+ DOUB TITL ""
SET CONS OFF
SET ALTE TO QWE.TXT
SET ALTE ON
SELE QWER
?"PARTY ID :"+PADR(M.PNAME,40)
?REPL("-",45)
?PADC("DATE",10)+" "+PADR("ENT.NO",6)+" "+PADR("ITEM NAME",15)+" "+PADC("PRFT",4)+" "+PADC("DISC",4)+" "+PADC("R.D.",4)
?REPL("-",45)
SCAN
	?DTOC(DATE)+" "+STR(PURNO,6)+" "+PADR(ITNAME,15)+" "+PADR(ALLT(STR(PROFIT))+" %",4)+" "+PADR(ALLT(STR(DIS))+" "+ALLT(STR(DIS1)),5)+" "+PADR(ALLT(STR(RD))+" "+ALLT(STR(RD1)),5)
ENDS
?REPL("-",45)
SET ALTE TO
ACTI WIND QWE 
MODI FILE QWE.TXT WIND QWE NOED 
RELE WIND QWE
SET CONS ON
RETU





PROC PRERATE
M.R1=XR1
M.R2=XR2
M.R3=XR3
M.R4=XR4
M.R5=XR5
M.R6=XR6
M.R7=XR7
M.R8=XR8
M.R9=XR9
M.R10=XR10
M.R11=XR11
M.R12=XR12
SHOW GETS

PROC CHKDETT
IF M.DET=.T.
	DO DETAIL
ENDI	



PROC CHKPURNO
if empt(XTTPURNO)
	retu 0
endi
SELE PURCHASE
SET ORDER TO ENTRYNO
SEEK XTTPURNO
IF !FOUND()
	WAIT WIND "ENTRY NO."+ALLT(STR(XTTPURNO))+" NOT FOUND...!" NOWA
	RETU 0
ENDI
IF XTTPURNO<=37390
	WAIT WIND "PREVIOUS YEAR CANNOT CHANGE IT." NOWA
	RETU 0 
ENDI
RETU



