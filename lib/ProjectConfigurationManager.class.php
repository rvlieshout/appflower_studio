<?php
/**
 * Class configures project settings in project.yml
 * Class create/edit project.yml
 *
 * @author radu
 */
class ProjectConfigurationManager {

    static $defaultProjectTemplate = array(
       'project' => array(
            'name' => 'Studio playground',
            'description' => 'This is the Studio\'s playground, will be used for new projects',
            'autodeploy' => 'true'
        )
    );

    private $projectConfFilePath;
    private $projectConfTemplate;
	private $request;

    public function __construct($request) {
        $this->projectConfFilePath = afStudioUtil::getConfigDir() . '/' . 'project.yml';
        $this->request = $request;

        $this->setProjectConfTemplate();
    }

    private function setProjectConfTemplate()
    {
        if(file_exists($this->projectConfFilePath)) {
            $this->projectConfTemplate = $this->loadYaml($this->projectConfFilePath);
        } else {
            $this->projectConfTemplate = self::$defaultProjectTemplate;
        }
    }


    public function setProjectParams($params)
    {
        $this->projectConfTemplate['project'] = $params;
    }

    public function getProjectParams()
    {
    	$params = $this->projectConfTemplate['project'];
    	$params['path'] = afStudioUtil::getRootDir();
    	
        return $params;
    }

    private function loadYaml($filePath)
    {
        $sfYaml = new sfYaml();
        $fileData = $sfYaml->load($filePath);

        return $fileData;
    }

    private function dumpYaml($data)
    {
        $sfYaml = new sfYaml();
        $yamlData = $sfYaml->dump($data, 4);

        return $yamlData;
    }

    public function build()
    {    	
        if($this->request->hasParameter('type')&&$this->request->getParameter('type')=='save')
        {
        	$params = $this->request->getPostParameters();
        	unset($params['type']);
        	unset($params['path']);
        	
        	$params['autodeploy'] = !isset($params['autodeploy'])?false:true;
        	
        	$this->setProjectParams($params);
        	
        	@file_put_contents($this->projectConfFilePath, $this->dumpYaml($this->projectConfTemplate));	
        	
        	$result['success'] = true;
            $result['message'] = 'Project Settings saved successfully';
            
            afsNotificationPeer::log('Project Settings have been modified','Settings');
        }
        else {
        	$result['success'] = true;
        	$result['data'] = $this->getProjectParams();
        }
		
        return json_encode($result);
    }
}
?>